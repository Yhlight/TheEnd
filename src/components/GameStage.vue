<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <!-- The start overlay is now controlled by the 'title' game state -->
    <audio ref="audioElement" src="/song.mp3" style="display: none;"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
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

// Game state management
const gameState = reactive({
  current: 'title', // 'title', 'songSelect', 'playing', 'results', 'settings'
});
let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

// Song select state
const songSelectState = reactive({
  selectedIndex: 0,
  cards: [],
});

const CARD_WIDTH = 400;
const CARD_HEIGHT = 100;
const CARD_MARGIN = 20;

const initializeGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth;
    gameCanvas.value.height = window.innerHeight;
    // Recalculate card positions on resize
    calculateCardPositions();
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
    null, // Chart will be loaded on song selection
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
  gameCanvas.value.addEventListener('mousemove', handleMove);
  gameCanvas.value.addEventListener('touchmove', handleMove);


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

const calculateCardPositions = () => {
    songSelectState.cards = songLibrary.map((song, index) => {
        const x = (gameCanvas.value.width - CARD_WIDTH) / 2;
        const y = (gameCanvas.value.height / 2) - (songLibrary.length * (CARD_HEIGHT + CARD_MARGIN) / 2) + (index * (CARD_HEIGHT + CARD_MARGIN));
        return { song, x, y, width: CARD_WIDTH, height: CARD_HEIGHT };
    });
};

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

// --- Game State Updaters ---

const updateTitle = () => {
    dynamicBackground.update();
};

const updateSongSelect = () => {
    dynamicBackground.update();
};

const updatePlaying = () => {
  let gameTime = audioElement.value.currentTime * 1000;
  if (gameTime === 0) {
    if (gameStartTime === null) { gameStartTime = performance.now(); }
    gameTime = performance.now() - gameStartTime;
  }
  judgementLine.update(gameTime);
  noteManager.update(gameTime);
  effectManager.update();
  dynamicBackground.update();
};

// --- Game State Drawers ---

const drawTitle = () => {
    dynamicBackground.draw(ctx);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TheEnd', gameCanvas.value.width / 2, gameCanvas.value.height / 2 - 50);
    ctx.font = '24px sans-serif';
    ctx.fillText('Click to Start', gameCanvas.value.width / 2, gameCanvas.value.height / 2 + 20);
};

const drawSongSelect = () => {
    dynamicBackground.draw(ctx);
    songSelectState.cards.forEach((card, index) => {
        if (index === songSelectState.selectedIndex) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 4;
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
        }
        ctx.fillRect(card.x, card.y, card.width, card.height);
        ctx.strokeRect(card.x, card.y, card.width, card.height);

        ctx.fillStyle = 'white';
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(card.song.title, card.x + 20, card.y + 45);
        ctx.font = '20px sans-serif';
        ctx.fillText(card.song.artist, card.x + 20, card.y + 75);
    });
};

const drawPlaying = () => {
  dynamicBackground.draw(ctx);

  if (audioElement.value && audioElement.value.duration) {
    const progress = audioElement.value.currentTime / audioElement.value.duration;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.fillRect(0, 0, progress * gameCanvas.value.width, 5);
  }

  judgementLine.draw();
  noteManager.draw(ctx, judgementLine.x);
  effectManager.draw(ctx);

  drawStylizedNumber(ctx, scoreManager.getScore().toString(), gameCanvas.value.width - 20, 20, 4, 'white');
  if (scoreManager.getCombo() > 1) {
      const comboText = scoreManager.getCombo().toString();
      const textWidth = comboText.length * 5 * 8 + (comboText.length - 1) * 8;
      const x = (gameCanvas.value.width / 2) + (textWidth / 2);
      drawStylizedNumber(ctx, comboText, x, gameCanvas.value.height * 0.4, 8, 'white');
  }
};


// --- Input Handlers ---

const handlePress = (event) => {
  event.preventDefault();
  const rect = gameCanvas.value.getBoundingClientRect();
  const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
  const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

  switch (gameState.current) {
    case 'title':
      gameState.current = 'songSelect';
      break;
    case 'songSelect':
      songSelectState.cards.forEach((card, index) => {
        if (x > card.x && x < card.x + card.width && y > card.y && y < card.y + card.height) {
          songSelectState.selectedIndex = index;
          const selectedSong = songLibrary[index];
          noteManager.loadChart(selectedSong.chart);
          audioElement.value.play().catch(e => console.error("Audio error:", e));
          gameState.current = 'playing';
          gameStartTime = null; // Reset fallback timer
        }
      });
      break;
    case 'playing':
      const gameTime = audioElement.value.currentTime * 1000;
      const tapResult = noteManager.checkTapHit(gameTime);
      if (tapResult) {
          scoreManager.onHit(tapResult.judgement);
          effectManager.createExplosion(tapResult.note.x, judgementLine.y, tapResult.note.color);
          effectManager.createJudgementText(tapResult.note.x, judgementLine.y - 50, tapResult.judgement, tapResult.note.color);
          audioManager.playHitSound();
          judgementLine.flash(tapResult.note.color);
          dynamicBackground.triggerEffect();
          return;
      }
      const holdResult = noteManager.checkHoldStart(gameTime);
      if (holdResult) {
          scoreManager.onHit(holdResult.judgement);
          effectManager.createJudgementText(holdResult.note.x, judgementLine.y - 50, holdResult.judgement, holdResult.note.color);
          audioManager.playHitSound();
          return;
      }
      const dragResult = noteManager.checkDragStart(gameTime);
      if (dragResult) {
          scoreManager.onHit(dragResult.judgement);
          effectManager.createJudgementText(dragResult.note.x, judgementLine.y - 50, dragResult.judgement, dragResult.note.color);
          audioManager.playHitSound();
      }
      break;
  }
};

const handleMove = (event) => {
  event.preventDefault();
  if (gameState.current !== 'playing' || !noteManager) return;

  const rect = gameCanvas.value.getBoundingClientRect();
  const pointerX = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
  const relativeX = pointerX - judgementLine.x;
  noteManager.checkDragUpdate(relativeX);
};

const handleRelease = (event) => {
  event.preventDefault();
  if (gameState.current !== 'playing' || !noteManager) return;
  noteManager.checkHoldEnd();
  noteManager.checkDragEnd();
};

let gameStartTime = null;

// --- Main Game Loop ---
const gameLoop = () => {
  if (!ctx || !gameCanvas.value) return;

  // Update logic based on state
  switch (gameState.current) {
    case 'title': updateTitle(); break;
    case 'songSelect': updateSongSelect(); break;
    case 'playing': updatePlaying(); break;
  }

  // Clear canvas and draw based on state
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
  switch (gameState.current) {
    case 'title': drawTitle(); break;
    case 'songSelect': drawSongSelect(); break;
    case 'playing': drawPlaying(); break;
  }

  requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
/* Styles remain the same */
.game-container { position: relative; width: 100vw; height: 100vh; }
.game-canvas { display: block; background-color: #1a1a1a; }
.start-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); color: white; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 2em; }
</style>
