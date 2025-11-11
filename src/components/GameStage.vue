<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <!-- The start-overlay is no longer needed as we'll draw it on the canvas -->
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

// --- New Game State Management ---
const gameState = ref('title'); // 'title', 'songSelect', 'playing', 'results'

let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

// Animation state for the title screen
let titleTextAlpha = ref(0);
let titleTextFadeIn = true;

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
  noteManager = new NoteManager(gameCanvas.value, testChart, scoreManager, judgementLine);
  effectManager = new EffectManager();
  audioManager = new AudioManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  gameCanvas.value.addEventListener('mousedown', handleInput);
  gameCanvas.value.addEventListener('touchstart', handleInput);

  console.log('Game initialized.');
  gameLoop(); // Start the game loop immediately
};

const startGame = () => {
  if (audioElement.value) {
    audioElement.value.play().then(() => {
      gameState.value = 'playing';
    }).catch(error => {
      console.error("Audio playback failed:", error);
      // Even if audio fails, we can start the game in a silent mode or show an error
      gameState.value = 'playing';
    });
  }
};

onMounted(initializeGame);

const handleInput = (event) => {
  event.preventDefault();

  switch (gameState.value) {
    case 'title':
      // Any click on the title screen transitions to song select
      gameState.value = 'songSelect';
      break;
    case 'songSelect':
      // For now, any click starts the game. Later, this will handle song selection.
      startGame();
      break;
    case 'playing':
      if (noteManager && effectManager && scoreManager && audioManager) {
        const hitNote = noteManager.checkHit();
        if (hitNote) {
          scoreManager.onHit();
          effectManager.createExplosion(hitNote.x, hitNote.y, hitNote.color);
          audioManager.playHitSound();
          judgementLine.flash();
        } else {
          scoreManager.onMiss();
        }
      }
      break;
  }
};

const update = () => {
  dynamicBackground.update();

  switch (gameState.value) {
    case 'title':
      // Update title screen animations (e.g., blinking text)
      if (titleTextFadeIn) {
        titleTextAlpha.value += 0.01;
        if (titleTextAlpha.value >= 1) titleTextFadeIn = false;
      } else {
        titleTextAlpha.value -= 0.01;
        if (titleTextAlpha.value <= 0.2) titleTextFadeIn = true;
      }
      break;
    case 'playing':
      if (!audioElement.value) return;
      const gameTime = audioElement.value.currentTime * 1000;
      judgementLine.update();
      noteManager.update(gameTime);
      effectManager.update();
      break;
  }
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
  dynamicBackground.draw(ctx);

  switch (gameState.value) {
    case 'title':
      drawTitleScreen();
      break;
    case 'songSelect':
      // For now, we'll just show a placeholder.
      // This will be replaced by the song selection UI later.
       ctx.fillStyle = 'white';
       ctx.font = '32px Arial';
       ctx.textAlign = 'center';
       ctx.fillText("Select a Song (Click anywhere to start)", gameCanvas.value.width / 2, gameCanvas.value.height / 2);
      break;
    case 'playing':
      drawGameHUD();
      break;
  }
};

const drawTitleScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;

  // Draw the main title "TheEnd" with geometric style
  ctx.save();
  ctx.font = 'bold 120px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 20;
  ctx.fillText("TheEnd", centerX, centerY - 50);
  ctx.restore();

  // Draw blinking "Click to Start" text
  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`;
  ctx.textAlign = 'center';
  ctx.fillText("Click to Start", centerX, centerY + 50);
  ctx.restore();
};

const drawGameHUD = () => {
  // Draw progress bar
  if (audioElement.value && audioElement.value.duration) {
    const progress = audioElement.value.currentTime / audioElement.value.duration;
    const progressBarWidth = progress * gameCanvas.value.width;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.fillRect(0, 0, progressBarWidth, 5);
  }

  judgementLine.draw();
  noteManager.draw();
  effectManager.draw(ctx);

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
}

const gameLoop = () => {
  update();
  draw();
  requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
.game-container { position: relative; width: 100vw; height: 100vh; }
.game-canvas { display: block; background-color: #1a1a1a; }
</style>
