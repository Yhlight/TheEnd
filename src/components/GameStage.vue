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
  effectManager = new EffectManager();
  audioManager = new AudioManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  // Pass all manager dependencies to the NoteManager
  noteManager = new NoteManager(
    gameCanvas.value,
    testChart,
    scoreManager,
    judgementLine,
    audioManager,
    effectManager
  );
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  // Set up input listeners
  gameCanvas.value.addEventListener('mousedown', handlePress);
  gameCanvas.value.addEventListener('touchstart', handlePress);
  gameCanvas.value.addEventListener('mouseup', handleRelease);
  gameCanvas.value.addEventListener('touchend', handleRelease);


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

// Data structure for drawing stylized numbers (5x7 matrix)
const NUMBER_MAP = {
  '0': [
    " XXX ",
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    "X   X",
    " XXX ",
  ],
  '1': [
    "  X  ",
    " XX  ",
    "  X  ",
    "  X  ",
    "  X  ",
    "  X  ",
    " XXX ",
  ],
  '2': [
    " XXX ",
    "X   X",
    "    X",
    "   X ",
    "  X  ",
    " X   ",
    "XXXXX",
  ],
  '3': [
    " XXX ",
    "X   X",
    "    X",
    " XXX ",
    "    X",
    "X   X",
    " XXX ",
  ],
  '4': [
    "X   X",
    "X   X",
    "X   X",
    "XXXXX",
    "    X",
    "    X",
    "    X",
  ],
  '5': [
    "XXXXX",
    "X    ",
    "X    ",
    "XXXX ",
    "    X",
    "X   X",
    " XXX ",
  ],
  '6': [
    " XXX ",
    "X   X",
    "X    ",
    "XXXX ",
    "X   X",
    "X   X",
    " XXX ",
  ],
  '7': [
    "XXXXX",
    "X   X",
    "    X",
    "   X ",
    "  X  ",
    "  X  ",
    "  X  ",
  ],
  '8': [
    " XXX ",
    "X   X",
    "X   X",
    " XXX ",
    "X   X",
    "X   X",
    " XXX ",
  ],
  '9': [
    " XXX ",
    "X   X",
    "X   X",
    " XXXX",
    "    X",
    "X   X",
    " XXX ",
  ],
};

/**
 * Draws a number on the canvas using a stylized square matrix.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {string} text - The string of numbers to draw.
 * @param {number} x - The x-coordinate of the top-right corner of the text.
 * @param {number} y - The y-coordinate of the top-right corner of the text.
 * @param {number} squareSize - The size of each square pixel.
 * @param {string} color - The color of the squares.
 */
const drawStylizedNumber = (ctx, text, x, y, squareSize, color) => {
  const textWidth = text.length * 5 * squareSize + (text.length - 1) * squareSize;
  let currentX = x - textWidth;

  for (const char of text) {
    const matrix = NUMBER_MAP[char];
    if (!matrix) continue;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 'X') {
          ctx.fillStyle = color;
          ctx.fillRect(
            currentX + col * squareSize,
            y + row * squareSize,
            squareSize,
            squareSize
          );
        }
      }
    }
    currentX += 6 * squareSize; // 5 columns for the char + 1 for spacing
  }
};

const handlePress = (event) => {
  event.preventDefault();
  if (!isPlaying.value) return;
  const gameTime = audioElement.value.currentTime * 1000;

  if (noteManager && effectManager && scoreManager && audioManager) {
    const hitResult = noteManager.checkTapHit(gameTime);
    if (hitResult) {
      const { note, judgement } = hitResult;
      scoreManager.onHit(judgement);
      effectManager.createExplosion(note.x, judgementLine.y, note.color);
      effectManager.createJudgementText(note.x, judgementLine.y - 50, judgement, note.color);
      audioManager.playHitSound();
      judgementLine.flash(note.color); // Trigger the flash effect

      // Also trigger the background grid effect
      dynamicBackground.triggerEffect();

    } else {
      // If no tap note was hit, check for a hold note start
      const holdResult = noteManager.checkHoldStart(gameTime);
      if (holdResult) {
        const { note, judgement } = holdResult;
        // Provide initial feedback for starting the hold
        scoreManager.onHit(judgement);
        effectManager.createJudgementText(note.x, judgementLine.y - 50, judgement, note.color);
        audioManager.playHitSound(); // Maybe a different sound for holds later
      }
    }
  }
};

const handleRelease = (event) => {
  event.preventDefault();
  if (!isPlaying.value) return;

  if (noteManager) {
    noteManager.checkHoldEnd();
  }
};

const update = () => {
  if (!isPlaying.value || !audioElement.value) return;
  const gameTime = audioElement.value.currentTime * 1000;

  if (judgementLine) judgementLine.update(gameTime);
  if (noteManager) noteManager.update(gameTime);
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
    // Draw Score
    drawStylizedNumber(ctx, scoreManager.getScore().toString(), gameCanvas.value.width - 20, 20, 4, 'white');

    // Draw Combo
    if (scoreManager.getCombo() > 1) {
      const comboText = scoreManager.getCombo().toString();
      const textWidth = comboText.length * 5 * 8 + (comboText.length - 1) * 8;
      const x = (gameCanvas.value.width / 2) + (textWidth / 2);
      drawStylizedNumber(ctx, comboText, x, gameCanvas.value.height * 0.4, 8, 'white');
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
