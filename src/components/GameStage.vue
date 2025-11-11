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
import { songLibrary } from '../core/ChartData.js';
import { EffectManager } from '../core/EffectManager.js';
import { ScoreManager } from '../core/ScoreManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { DynamicBackground } from '../core/DynamicBackground.js';

// Refs for DOM elements
const gameCanvas = ref(null);
const audioElement = ref(null);

// Game State Management
const gameState = ref('title');

let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

// Title screen specific state
let titleTextAlpha = ref(0);
let titleTextFadeIn = true;
let titleCrystals = [];

const songBoxWidth = 400;
const songBoxHeight = 100;
const songBoxGap = 20;

const initializeTitleScreen = () => {
  titleCrystals = [];
  if (!gameCanvas.value) return;
  for (let i = 0; i < 20; i++) { // Create 20 crystals
    titleCrystals.push({
      x: Math.random() * gameCanvas.value.width,
      y: Math.random() * gameCanvas.value.height,
      size: Math.random() * 25 + 10, // size 10 to 35
      vx: (Math.random() - 0.5) * 0.4, // slow horizontal drift
      vy: (Math.random() - 0.5) * 0.4, // slow vertical drift
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.3 + 0.1 // 0.1 to 0.4 opacity
    });
  }
};

const initializeGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth;
    gameCanvas.value.height = window.innerHeight;
    // Re-initialize title screen elements on resize to fit new dimensions
    if (gameState.value === 'title') {
      initializeTitleScreen();
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  judgementLine = new JudgementLine(gameCanvas.value);
  scoreManager = new ScoreManager();
  noteManager = new NoteManager(gameCanvas.value, null, scoreManager, judgementLine);
  effectManager = new EffectManager();
  audioManager = new AudioManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  initializeTitleScreen(); // Initialize crystals first time

  gameCanvas.value.addEventListener('mousedown', handlePress);
  gameCanvas.value.addEventListener('touchstart', handlePress);
  gameCanvas.value.addEventListener('mouseup', handleRelease);
  gameCanvas.value.addEventListener('touchend', handleRelease);
  gameCanvas.value.addEventListener('mousemove', handleMove);
  gameCanvas.value.addEventListener('touchmove', handleMove);

  console.log('Game initialized.');
  gameLoop();
};

const startGame = (chart) => {
  noteManager.loadChart(chart);
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

// UI Element Positions
const pauseButton = { x: 20, y: 20, width: 40, height: 40 };

const handlePress = (event) => {
  event.preventDefault();
  const rect = gameCanvas.value.getBoundingClientRect();
  const x = (event.clientX ?? event.touches[0].clientX) - rect.left;
  const y = (event.clientY ?? event.touches[0].clientY) - rect.top;

  switch (gameState.value) {
    case 'title':
      gameState.value = 'songSelect';
      break;
    case 'songSelect':
      const centerX = gameCanvas.value.width / 2;
      songLibrary.forEach((song, index) => {
        const boxX = centerX - songBoxWidth / 2;
        const boxY = 150 + index * (songBoxHeight + songBoxGap);
        if (x >= boxX && x <= boxX + songBoxWidth && y >= boxY && y <= boxY + songBoxHeight) {
          startGame(song.chart);
        }
      });
      break;
    case 'playing':
      // Check for pause button press first
      if (x >= pauseButton.x && x <= pauseButton.x + pauseButton.width && y >= pauseButton.y && y <= pauseButton.y + pauseButton.height) {
        gameState.value = 'paused';
        audioElement.value.pause();
        return;
      }

      if (noteManager && effectManager && scoreManager && audioManager) {
        // Priority: Drag > Hold > Tap
        const startedDragNote = noteManager.checkDragStart();
        if (startedDragNote) {
          judgementLine.flash(startedDragNote.color);
          audioManager.playHitSound();
          dynamicBackground.triggerEffect();
          return;
        }

        const startedHoldNote = noteManager.checkHoldStart();
        if (startedHoldNote) {
          judgementLine.flash(startedHoldNote.color);
          audioManager.playHitSound();
          dynamicBackground.triggerEffect();
          return;
        }

        const hitTapNote = noteManager.checkTapHit();
        if (hitTapNote) {
          scoreManager.onHit();
          effectManager.createExplosion(hitTapNote.x, hitTapNote.y, hitTapNote.color);
          audioManager.playHitSound();
          judgementLine.flash(hitTapNote.color);
          dynamicBackground.triggerEffect();
        } else {
          // scoreManager.onMiss(); // Miss on empty space is optional
        }
      }
      break;
    case 'paused':
      // Click anywhere to unpause
      gameState.value = 'playing';
      audioElement.value.play();
      break;
    case 'results':
      scoreManager.reset();
      gameState.value = 'songSelect';
      break;
  }
};

const handleRelease = (event) => {
  event.preventDefault();
  if (gameState.value === 'playing') {
    noteManager.checkHoldEnd();
    noteManager.checkDragEnd();
  }
};

const handleMove = (event) => {
  event.preventDefault();
  if (gameState.value === 'playing') {
    const rect = gameCanvas.value.getBoundingClientRect();
    const x = (event.clientX ?? event.touches[0].clientX) - rect.left;
    noteManager.checkDragUpdate(x);
  }
};


const update = () => {
  // Always update background for a lively feel, even when paused
  dynamicBackground.update();

  switch (gameState.value) {
    case 'title':
      // Update blinking text
      if (titleTextFadeIn) {
        titleTextAlpha.value += 0.01;
        if (titleTextAlpha.value >= 1) titleTextFadeIn = false;
      } else {
        titleTextAlpha.value -= 0.01;
        if (titleTextAlpha.value <= 0.2) titleTextFadeIn = true;
      }
      // Update crystals
      titleCrystals.forEach(crystal => {
        crystal.x += crystal.vx;
        crystal.y += crystal.vy;
        crystal.rotation += crystal.rotationSpeed;
        // Wrap around screen edges for continuous floating
        if (crystal.x > gameCanvas.value.width + crystal.size) crystal.x = -crystal.size;
        if (crystal.x < -crystal.size) crystal.x = gameCanvas.value.width + crystal.size;
        if (crystal.y > gameCanvas.value.height + crystal.size) crystal.y = -crystal.size;
        if (crystal.y < -crystal.size) crystal.y = gameCanvas.value.height + crystal.size;
      });
      break;
    case 'playing':
      if (!audioElement.value) return;
      if (audioElement.value.ended) {
        gameState.value = 'results';
        break;
      }
      const gameTime = audioElement.value.currentTime * 1000;
      judgementLine.update();
      noteManager.update(gameTime);
      effectManager.update();
      break;
    case 'paused':
      // Do nothing to freeze the game state
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
      drawSongSelectScreen();
      break;
    case 'playing':
      drawGameHUD();
      break;
    case 'paused':
      // Draw the frozen game state first
      drawGameHUD();
      // Then draw the pause overlay
      drawPauseScreen();
      break;
    case 'results':
      drawResultsScreen();
      break;
  }
};

const drawResultsScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;
  ctx.fillStyle = 'white';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 15;
  ctx.fillText("Results", centerX, centerY - 200);
  ctx.font = '30px Arial';
  ctx.fillText("Final Score", centerX, centerY - 100);
  const score = scoreManager.getScore();
  const scoreDigitSize = 6;
  const scoreWidth = 7 * (3 * scoreDigitSize + scoreDigitSize);
  drawStylizedNumber(score, centerX - scoreWidth / 2, centerY - 80, scoreDigitSize, 'white');
  ctx.font = '30px Arial';
  ctx.fillText("Max Combo", centerX, centerY + 50);
  const maxCombo = scoreManager.getMaxCombo();
  const comboDigitSize = 6;
  const comboStr = String(maxCombo);
  const comboWidth = comboStr.length * (3 * comboDigitSize + comboDigitSize);
  drawStylizedNumber(maxCombo, centerX - comboWidth / 2, centerY + 70, comboDigitSize, 'white');
  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`;
  ctx.textAlign = 'center';
  ctx.fillText("Click to Continue", centerX, centerY + 200);
  ctx.restore();
};

const drawTitleScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;

  // Draw floating crystals
  titleCrystals.forEach(crystal => {
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    ctx.rotate(crystal.rotation * Math.PI / 180);
    ctx.fillStyle = `rgba(200, 220, 255, ${crystal.alpha})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${crystal.alpha + 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(180, 210, 255, 0.7)';
    ctx.shadowBlur = 10;
    // Draw a rhombus shape
    ctx.beginPath();
    ctx.moveTo(0, -crystal.size);
    ctx.lineTo(crystal.size / 1.5, 0);
    ctx.lineTo(0, crystal.size);
    ctx.lineTo(-crystal.size / 1.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Draw the main title
  ctx.save();
  ctx.font = 'bold 120px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 20;
  ctx.fillText("TheEnd", centerX, centerY - 50);
  ctx.restore();

  // Draw the "Click to Start" prompt
  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`;
  ctx.textAlign = 'center';
  ctx.fillText("Click to Start", centerX, centerY + 50);
  ctx.restore();
};

const drawSongSelectScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Select a Song", centerX, 80);
  songLibrary.forEach((song, index) => {
    const boxX = centerX - songBoxWidth / 2;
    const boxY = 150 + index * (songBoxHeight + songBoxGap);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, songBoxWidth, songBoxHeight);
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(song.title, boxX + 20, boxY + 45);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '20px Arial';
    ctx.fillText(song.artist, boxX + 20, boxY + 75);
  });
};

const drawPauseScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

  // "Paused" text
  ctx.save();
  ctx.font = 'bold 90px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 20;
  ctx.fillText("Paused", centerX, centerY - 50);
  ctx.restore();

  // "Click to Resume" text
  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`; // Use blinking alpha
  ctx.textAlign = 'center';
  ctx.fillText("Click anywhere to Resume", centerX, centerY + 50);
  ctx.restore();
};

const drawGameHUD = () => {
  // Draw Pause Button
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  // Two vertical bars for the pause icon
  ctx.strokeRect(pauseButton.x + 8, pauseButton.y + 8, 8, 24);
  ctx.strokeRect(pauseButton.x + 24, pauseButton.y + 8, 8, 24);

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
    const score = scoreManager.getScore();
    const scoreDigitSize = 4;
    const scoreWidth = 7 * (3 * scoreDigitSize + scoreDigitSize);
    drawStylizedNumber(score, gameCanvas.value.width - scoreWidth - 20, 20, scoreDigitSize, 'white');
    const combo = scoreManager.getCombo();
    if (combo > 1) {
      const comboStr = String(combo);
      const comboDigitSize = 8;
      const comboWidth = comboStr.length * (3 * comboDigitSize + comboDigitSize);
      const comboX = (gameCanvas.value.width - comboWidth) / 2;
      const comboY = (gameCanvas.value.height - (5 * comboDigitSize)) / 2;
      drawStylizedNumber(combo, comboX, comboY, comboDigitSize, 'rgba(0, 255, 255, 0.8)');
    }
  }
};

const NUMBER_TEMPLATES = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
};

const drawStylizedNumber = (number, x, y, size, color) => {
  const numberStr = String(number).padStart(7, '0');
  const digitWidth = 3 * size;
  const digitSpacing = size;
  let currentX = x;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 1.5;
  for (const digit of numberStr) {
    const template = NUMBER_TEMPLATES[digit];
    if (template) {
      for (let row = 0; row < template.length; row++) {
        for (let col = 0; col < template[row].length; col++) {
          if (template[row][col] === 1) {
            ctx.fillRect(currentX + col * size, y + row * size, size, size);
          }
        }
      }
    }
    currentX += digitWidth + digitSpacing;
  }
};

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
