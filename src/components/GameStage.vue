<template>
  <div class="game-stage-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    <!-- The HUD and other UI overlays will be placed here, outside the canvas -->
    <div class="ui-overlay">
      <HUD v-if="isPlaying" :score="score" :combo="combo" @pause="togglePause" />
      <ProgressBar v-if="isPlaying" :song-time="gameTime" :song-duration="chart.duration" />
    </div>

    <!-- Pause Menu -->
    <div v-if="isPaused" class="pause-overlay">
       <div class="pause-menu" v-if="!showSettings">
        <h2>Paused</h2>
        <button @click="togglePause">Resume</button>
        <button @click="showSettings = true">Settings</button>
        <button @click="$emit('exit')">Exit to Menu</button>
      </div>
       <settings-menu
        v-if="showSettings"
        :settings="settings"
        @close="showSettings = false"
        @settingsChange="handleSettingsChange"
      />
    </div>

    <!-- Loading/Start Screen -->
    <div v-if="!isPlaying" class="start-overlay">
        <h1 v-if="isLoading">Loading...</h1>
        <button v-else @click="startGame">Start</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch } from 'vue';
import { AudioManager } from '../core/AudioManager.js';
import { NoteManager } from '../core/NoteManager.js';
import { ScoreManager } from '../core/ScoreManager.js';
import { EffectManager } from '../core/EffectManager.js';
import { JudgementLine } from '../core/JudgementLine.js';
import { CameraManager } from '../core/CameraManager.js';
import { DynamicBackground } from '../core/DynamicBackground.js';
import HUD from './HUD.vue';
import ProgressBar from './ProgressBar.vue';
import SettingsMenu from './SettingsMenu.vue';

const props = defineProps({
  chartData: { type: Object, required: true },
  settings: { type: Object, required: true },
});

const emit = defineEmits(['exit', 'songFinished', 'settingsChange']);

// --- Refs and Reactive State ---
const containerRef = ref(null);
const canvasRef = ref(null);
const isLoading = ref(true);
const isPlaying = ref(false);
const isPaused = ref(false);
const showSettings = ref(false);
const isDragging = ref(false);

const gameTime = ref(0);
const score = ref(0);
const combo = ref(0);
const chart = reactive(props.chartData);

// --- Game Modules ---
let ctx = null;
let audioManager = null;
let noteManager = null;
let scoreManager = null;
let effectManager = null;
let judgementLine = null;
let cameraManager = null;
let dynamicBackground = null;

let lastFrameTime = 0;
let gameStartTime = 0;

// --- Lifecycle Hooks ---
onMounted(() => {
  initializeGame();
});

onUnmounted(() => {
  // Clean up resources
  audioManager.stopBgm();
  window.removeEventListener('resize', handleResize);
  containerRef.value.removeEventListener('mousedown', handlePress);
  containerRef.value.removeEventListener('mouseup', handleRelease);
  containerRef.value.removeEventListener('touchstart', handlePress);
  containerRef.value.removeEventListener('touchend', handleRelease);
});

// --- Game Initialization ---
async function initializeGame() {
  const canvas = canvasRef.value;
  ctx = canvas.getContext('2d');

  // Initialize Managers
  const sfxMap = {
      tap: '/audio/perfect_hit.mp3', // Placeholder sfx
      miss: '/audio/miss.wav'
  };
  audioManager = new AudioManager(sfxMap, props.settings.volume / 100);
  effectManager = new EffectManager();
  scoreManager = new ScoreManager(chart.notes.length);
  judgementLine = new JudgementLine(chart.lineEvents || []);
  cameraManager = new CameraManager(chart.cameraEvents || []);
  noteManager = new NoteManager(chart, props.settings.noteSpeed);
  dynamicBackground = new DynamicBackground(canvas.width, canvas.height);

  handleResize();
  window.addEventListener('resize', handleResize);

  // Add input listeners
  containerRef.value.addEventListener('mousedown', handlePress);
  containerRef.value.addEventListener('mouseup', handleRelease);
  containerRef.value.addEventListener('touchstart', handlePress, { passive: false });
  containerRef.value.addEventListener('touchend', handleRelease);


  // Load audio
  try {
    await Promise.all([
        audioManager.loadBgm(chart.audioUrl),
        audioManager.loadSfx()
    ]);
  } catch (error) {
      console.error("Audio loading failed. Gameplay may be affected.", error);
      // Allow starting the game anyway, it will run on performance.now() clock.
  }

  isLoading.value = false;
  console.log('Game initialized and ready.');
}

function startGame() {
  if (isLoading.value) return;

  // Reset state
  scoreManager.reset();
  noteManager.loadChart(chart); // Reload to reset notes
  score.value = 0;
  combo.value = 0;

  // Start game
  isPlaying.value = true;
  isPaused.value = false;
  gameStartTime = performance.now();
  lastFrameTime = gameStartTime;

  audioManager.playBgm();

  requestAnimationFrame(gameLoop);
}


// --- Game Loop ---
function gameLoop(timestamp) {
  if (!isPlaying.value || isPaused.value) return;

  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  // Use the more accurate audio context time if available
  if (audioManager.isBgmLoaded) {
      gameTime.value = audioManager.getContextTime() * 1000 + props.settings.audioOffset;
  } else {
      // Fallback to performance.now() if audio failed to load
      gameTime.value = (timestamp - gameStartTime) + props.settings.audioOffset;
  }

  // Update all game modules
  dynamicBackground.update();
  judgementLine.update(gameTime.value);
  cameraManager.update(gameTime.value);
  const processedJudgements = noteManager.update(gameTime.value, isDragging.value);
  processedJudgements.forEach(result => {
      scoreManager.addJudgement(result.judgement);
      combo.value = scoreManager.combo;
      score.value = Math.round(scoreManager.score);

      // Trigger effects for auto-processed notes (catch notes, misses)
      const renderX = (result.note.x - 0.5) * canvasRef.value.width;
      effectManager.createExplosion(renderX, 0, result.judgement);
      effectManager.createJudgementText(result.judgement, result.note.x, 0);
  });
  effectManager.update();

  // Drawing
  draw();

  // Check for song end
  if (gameTime.value >= chart.duration) {
      isPlaying.value = false;
      emit('songFinished', scoreManager.getResults());
      return;
  }

  requestAnimationFrame(gameLoop);
}


// --- Drawing ---
function draw() {
  const canvas = canvasRef.value;
  if (!ctx || !canvas) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background first
  dynamicBackground.draw(ctx);

  // --- Game World Drawing ---
  ctx.save();

  // Move camera to center of screen and apply camera transformations
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(cameraManager.zoom, cameraManager.zoom);
  ctx.rotate(cameraManager.rotation * (Math.PI / 180));
  ctx.translate(cameraManager.x, cameraManager.y);

  // Apply judgement line transformations
  ctx.translate(judgementLine.x, judgementLine.y);
  ctx.rotate(judgementLine.rotation * (Math.PI / 180));

  // Draw game elements (relative to the judgement line)
  judgementLine.draw(ctx, canvas.width, canvas.height);
  noteManager.draw(ctx, canvas.width);
  effectManager.draw(ctx, canvas.width, canvas.height);

  ctx.restore();
  // --- End Game World Drawing ---
}

// --- Input Handlers ---
function handlePress(event) {
    event.preventDefault();
    if (!isPlaying.value || isPaused.value) return;
    isDragging.value = true;

    const result = noteManager.checkTapHit(gameTime.value);
    if (result) {
        scoreManager.addJudgement(result.judgement);
        score.value = Math.round(scoreManager.score);
        combo.value = scoreManager.combo;

        // Trigger visual and audio feedback
        const renderX = (result.note.x - 0.5) * canvasRef.value.width;
        effectManager.createExplosion(renderX, 0, result.judgement); // At y=0 on the judgement line
        effectManager.createJudgementText(result.judgement, result.note.x, 0);
        if (result.judgement === 'perfect') {
            effectManager.createShockwave(renderX, 0);
            dynamicBackground.triggerEffect();
        }
        judgementLine.flash();
        audioManager.playSfx('tap');
    }
}

function handleRelease(event) {
    if (!isPlaying.value || isPaused.value) return;
    isDragging.value = false;

    const releasedJudgements = noteManager.checkHoldRelease(gameTime.value);
    releasedJudgements.forEach(result => {
        scoreManager.addJudgement(result.judgement);
        score.value = Math.round(scoreManager.score);
        combo.value = scoreManager.combo;
        // Optional: add release effect
    });
}

// --- UI and System ---
function togglePause() {
  if (!isPlaying.value) return;
  isPaused.value = !isPaused.value;

  if (isPaused.value) {
    audioManager.stopBgm(); // Simple pause, will restart on resume
  } else {
    showSettings.value = false;
    // To resume accurately, we'd need to track pause time and offset audio
    // For now, let's just restart the music. A more robust solution is needed for perfect sync.
    audioManager.playBgm(0, gameTime.value / 1000);
    requestAnimationFrame(gameLoop);
  }
}

function handleSettingsChange(newSettings) {
    emit('settingsChange', newSettings);
}

function handleResize() {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (canvas && container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    dynamicBackground.resize(canvas.width, canvas.height);
    draw(); // Redraw on resize
  }
}

// --- Watchers ---
watch(() => props.settings.volume, (newVolume) => {
    if (audioManager) {
        audioManager.setVolume(newVolume / 100);
    }
});

watch(() => props.settings.noteSpeed, (newSpeed) => {
    if (noteManager) {
        noteManager.noteSpeed = newSpeed;
    }
});
watch(() => props.settings.backgroundBrightness, (newBrightness) => {
    if (dynamicBackground) {
        dynamicBackground.setBrightness(newBrightness / 100);
    }
});


</script>

<style scoped>
.game-stage-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: #000;
  cursor: pointer;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow clicks to pass through to the canvas */
  z-index: 10;
}

.pause-overlay, .start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  color: white;
}
.pause-menu {
  text-align: center;
}
.pause-menu button, .start-overlay button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 18px;
  background: rgba(0,0,0,0.4);
  color: white;
  border: 2px solid white;
}
</style>
