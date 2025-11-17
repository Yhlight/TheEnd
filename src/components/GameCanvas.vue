<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Application } from 'pixi.js';
import { drawSquare } from '../core/graphics.js';

const canvasContainer = ref(null);
const app = new Application();

onMounted(() => {
  nextTick(async () => {
    if (canvasContainer.value) {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a1a,
      });
      canvasContainer.value.appendChild(app.canvas);

      // --- Render a test square ---
      const testSquare = drawSquare(
        app.screen.width / 2,  // Center X
        app.screen.height / 2, // Center Y
        100,                   // Size
        0xFFFFFF               // Color (white)
      );
      app.stage.addChild(testSquare);
      // -------------------------
    }
  });
});

onUnmounted(() => {
  if (app && app.canvas) {
    app.destroy(true);
  }
});
</script>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
}
</style>
