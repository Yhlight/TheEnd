<template>
  <canvas ref="gameCanvas" class="game-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { JudgementLine } from '../core/JudgementLine.js';
import { NoteManager } from '../core/NoteManager.js';
import { testChart } from '../core/Chart.js';
import { EffectManager } from '../core/EffectManager.js';
import { ScoreManager } from '../core/ScoreManager.js';

// A ref to hold the canvas DOM element
const gameCanvas = ref(null);
// To hold the 2D rendering context, which will be used by other parts of the game logic
let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;

// Game state
let startTime = 0;
let gameTime = 0;

onMounted(() => {
  if (gameCanvas.value) {
    // Get the rendering context
    ctx = gameCanvas.value.getContext('2d');

    // Function to handle resizing
    const resizeCanvas = () => {
      gameCanvas.value.width = window.innerWidth;
      gameCanvas.value.height = window.innerHeight;
    };

    // Set initial size
    resizeCanvas();

    // A simple test to confirm the canvas is working
    if (ctx) {
      console.log('Canvas initialized.');
      // Initialize game objects
      judgementLine = new JudgementLine(gameCanvas.value);
      noteManager = new NoteManager(gameCanvas.value, testChart);
      effectManager = new EffectManager();
      scoreManager = new ScoreManager();

      // Record the start time
      startTime = performance.now();

      // Start the game loop
      gameLoop();
    } else {
      console.error('Failed to get 2D context');
    }

    // Add event listener for window resizing
    window.addEventListener('resize', resizeCanvas);

    // Add input listeners
    gameCanvas.value.addEventListener('mousedown', handleInput);
    gameCanvas.value.addEventListener('touchstart', handleInput);

  } else {
    console.error('Canvas element not found');
  }
});

const handleInput = (event) => {
  event.preventDefault();

  if (noteManager && judgementLine && effectManager && scoreManager) {
    const hitNote = noteManager.checkHit(judgementLine.y);
    if (hitNote) {
      scoreManager.onHit();
      effectManager.createExplosion(hitNote.x, hitNote.y, hitNote.color);
    } else {
      scoreManager.onMiss();
    }
  }
};

const update = () => {
  gameTime = performance.now() - startTime;

  if (judgementLine) {
    judgementLine.update();
  }
  if (noteManager) {
    noteManager.update(gameTime);
  }
  if (effectManager) {
    effectManager.update();
  }
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

  if (judgementLine) {
    judgementLine.draw();
  }
  if (noteManager) {
    noteManager.draw();
  }
  if (effectManager) {
    effectManager.draw(ctx);
  }

  // Draw HUD (Score and Combo)
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
  update();
  draw();
  requestAnimationFrame(gameLoop);
};

</script>

<style scoped>
.game-canvas {
  display: block;
  background-color: #1a1a1a;
}
</style>
