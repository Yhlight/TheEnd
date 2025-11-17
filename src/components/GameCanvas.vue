<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Application } from 'pixi.js';
import { drawSquare } from '../core/graphics.js';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';

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
        app.screen.width / 2,
        app.screen.height / 2,
        100,
        0xFFFFFF
      );
      app.stage.addChild(testSquare);
      // -------------------------

      // --- Apply a glow effect ---
      const bloomFilter = new AdvancedBloomFilter({
        threshold: 0.5,
        bloomScale: 1.5,
        quality: 8,
      });
      testSquare.filters = [bloomFilter];
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
