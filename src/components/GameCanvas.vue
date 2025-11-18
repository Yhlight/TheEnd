<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Application } from 'pixi.js';
import chartManager from '../core/chartManager.js';

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

      // --- Load and verify the sample chart ---
      try {
        const chartData = await chartManager.loadChart('sample.json');
        console.log('Chart loaded successfully:', JSON.stringify(chartData));
      } catch (error) {
        console.error('Failed to load chart in component:', error);
      }
      // ------------------------------------
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
