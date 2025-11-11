<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <audio ref="audioElement" src="/song.mp3" style="display: none;"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { JudgementLine } from '../core/JudgementLine.js';
import { NoteManager } from '../core/NoteManager.js';
// Import the entire song library instead of the single test chart
import { songLibrary } from '../core/ChartData.js';
import { EffectManager } from '../core/EffectManager.js';
import { ScoreManager } from '../core/ScoreManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { DynamicBackground } from '../core/DynamicBackground.js';

// Refs for DOM elements
const gameCanvas = ref(null);
const audioElement = ref(null);

// Game State Management
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

// --- Song Selection UI Constants ---
const songBoxWidth = 400;
const songBoxHeight = 100;
const songBoxGap = 20;

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
  // Initialize NoteManager without a chart initially. It will be loaded on song selection.
  noteManager = new NoteManager(gameCanvas.value, null, scoreManager, judgementLine);
  effectManager = new EffectManager();
  audioManager = new AudioManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  gameCanvas.value.addEventListener('mousedown', handleInput);
  gameCanvas.value.addEventListener('touchstart', handleInput);

  console.log('Game initialized.');
  gameLoop();
};

const startGame = (chart) => {
  noteManager.loadChart(chart); // Load the selected chart
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
    audioElement.value.play().then(() => {
      gameState.value = 'playing';
    }).catch(error => {
      console.error("Audio playback failed:", error);
      gameState.value = 'playing';
    });
  }
};

onMounted(initializeGame);

const handleInput = (event) => {
  event.preventDefault();

  // Unified input coordinate handling for mouse and touch events
  const rect = gameCanvas.value.getBoundingClientRect();
  const x = (event.clientX ?? event.touches[0].clientX) - rect.left;
  const y = (event.clientY ?? event.touches[0].clientY) - rect.top;

  switch (gameState.value) {
    case 'title':
      gameState.value = 'songSelect';
      break;
    case 'songSelect':
      // Check if the click is within any of the song boxes
      const centerX = gameCanvas.value.width / 2;
      songLibrary.forEach((song, index) => {
        const boxX = centerX - songBoxWidth / 2;
        const boxY = 150 + index * (songBoxHeight + songBoxGap);

        if (x >= boxX && x <= boxX + songBoxWidth && y >= boxY && y <= boxY + songBoxHeight) {
          // If a song box is clicked, start the game with that song's chart
          startGame(song.chart);
        }
      });
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
      drawSongSelectScreen(); // Call the new drawing function
      break;
    case 'playing':
      drawGameHUD();
      break;
  }
};

const drawTitleScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;

  ctx.save();
  ctx.font = 'bold 120px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 20;
  ctx.fillText("TheEnd", centerX, centerY - 50);
  ctx.restore();

  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`;
  ctx.textAlign = 'center';
  ctx.fillText("Click to Start", centerX, centerY + 50);
  ctx.restore();
};

const drawSongSelectScreen = () => {
  const centerX = gameCanvas.value.width / 2;

  // Draw the title
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Select a Song", centerX, 80);

  // Draw the song list
  songLibrary.forEach((song, index) => {
    const boxX = centerX - songBoxWidth / 2;
    const boxY = 150 + index * (songBoxHeight + songBoxGap);

    // Draw the container box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, songBoxWidth, songBoxHeight);

    // Draw song title
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(song.title, boxX + 20, boxY + 45);

    // Draw artist name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '20px Arial';
    ctx.fillText(song.artist, boxX + 20, boxY + 75);
  });
};


const drawGameHUD = () => {
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
