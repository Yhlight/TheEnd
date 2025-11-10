<template>
  <canvas ref="gameCanvas" class="game-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { JudgementLine } from '../core/JudgementLine.js';
import { Note } from '../core/Note.js';

// A ref to hold the canvas DOM element
const gameCanvas = ref(null);
// To hold the 2D rendering context, which will be used by other parts of the game logic
let ctx = null;
let judgementLine = null;
let note = null; // A single note for now

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
      note = new Note(gameCanvas.value, gameCanvas.value.width / 2);


      // Start the game loop
      gameLoop();
    } else {
      console.error('Failed to get 2D context');
    }

    // Add event listener for window resizing
    window.addEventListener('resize', resizeCanvas);

  } else {
    console.error('Canvas element not found');
  }
});

const update = () => {
  if (note) {
    note.update();
  }
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  // Clear the canvas
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

  // Draw game elements
  if (judgementLine) {
    judgementLine.draw();
  }
  if (note) {
    note.draw();
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
  display: block; /* Removes default margin/padding issues */
  background-color: #1a1a1a;
}
</style>
