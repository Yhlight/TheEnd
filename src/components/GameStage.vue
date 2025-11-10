<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <div v-if="!isPlaying" class="start-overlay" @click="startGame">
      <h1>Click to Start</h1>
    </div>
    <audio ref="audioElement" src="/song.mp3" style="display: none;"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { JudgementLine } from '../core/JudgementLine.js';
import { NoteManager } from '../core/NoteManager.js';
import { testChart } from '../core/Chart.js';
import { EffectManager } from '../core/EffectManager.js';
import { ScoreManager } from '../core/ScoreManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { DynamicBackground } from '../core/DynamicBackground.js';

// Refs for DOM elements
const gameCanvas = ref(null);
const audioElement = ref(null);

// Game state
const isPlaying = ref(false);
let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

const initializeGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth;
    gameCanvas.value.height = window.innerHeight;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  judgementLine = new JudgementLine(gameCanvas.value);
  scoreManager = new ScoreManager();
  // Pass the judgementLine object directly to the NoteManager
  noteManager = new NoteManager(gameCanvas.value, testChart, scoreManager, judgementLine);
  effectManager = new EffectManager();
  audioManager = new AudioManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  gameCanvas.value.addEventListener('mousedown', handleInput);
  gameCanvas.value.addEventListener('touchstart', handleInput);

  console.log('Game initialized.');
};

const startGame = () => {
  if (audioElement.value) {
    audioElement.value.play().then(() => {
      isPlaying.value = true;
      gameLoop();
    }).catch(error => {
      console.error("Audio playback failed:", error);
    });
  }
};

onMounted(initializeGame);

const handleInput = (event) => {
  event.preventDefault();
  if (!isPlaying.value) return;

  if (noteManager && effectManager && scoreManager && audioManager) {
    const hitNote = noteManager.checkHit(); // No longer needs judgementLineY
    if (hitNote) {
      scoreManager.onHit();
      // Use emphasis color for hit particles
      effectManager.createExplosion(hitNote.x, hitNote.y, '#FF0000');
      audioManager.playHitSound();
      judgementLine.flash(); // Trigger the flash effect
    } else {
      scoreManager.onMiss();
    }
  }
};

const update = () => {
  if (!isPlaying.value || !audioElement.value) return;
  const gameTime = audioElement.value.currentTime * 1000;

  if (judgementLine) judgementLine.update();
  if (noteManager) noteManager.update(gameTime); // No longer needs judgementLineY
  if (effectManager) effectManager.update();
  if (dynamicBackground) dynamicBackground.update();
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

  // Draw background first, so it's behind everything else
  if (dynamicBackground) dynamicBackground.draw(ctx);

  // Draw progress bar
  if (audioElement.value && audioElement.value.duration) {
    const progress = audioElement.value.currentTime / audioElement.value.duration;
    const progressBarWidth = progress * gameCanvas.value.width;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)'; // Semi-transparent cyan
    ctx.fillRect(0, 0, progressBarWidth, 5); // 5px height at the top
  }

  if (judgementLine) judgementLine.draw();
  if (noteManager) noteManager.draw();
  if (effectManager) effectManager.draw(ctx);

  if (scoreManager) {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${scoreManager.getScore()}`, gameCanvas.value.width - 20, 40);

    if (scoreManager.getCombo() > 1) {
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${scoreManager.getCombo()}`, gameCanvas.value.width / 2, gameCanvas.value.height / 2);
    }
  }
};

const gameLoop = () => {
  if (!isPlaying.value) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
/* Styles remain the same */
.game-container { position: relative; width: 100vw; height: 100vh; }
.game-canvas { display: block; background-color: #1a1a1a; }
.start-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); color: white; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 2em; }
</style>
