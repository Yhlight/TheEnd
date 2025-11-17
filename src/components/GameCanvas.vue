<template>
  <canvas ref="gameCanvas"></canvas>
</template>

<script>
export default {
  name: 'GameCanvas',
  mounted() {
    const canvas = this.$refs.gameCanvas;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Draw a dark gray background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a white square
    ctx.fillStyle = '#fff';
    ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
  },
};
</script>

<style scoped>
canvas {
  display: block;
}
</style>
