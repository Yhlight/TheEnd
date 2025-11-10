<template>
  <canvas ref="canvas" class="dynamic-background"></canvas>
</template>

<script>
export default {
  name: 'DynamicBackground',
  data() {
    return {
      ctx: null,
      animationFrameId: null,
      gridSize: 50,
      time: 0
    };
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');
    this.resizeCanvas();
    this.animate();
    window.addEventListener('resize', this.resizeCanvas);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCanvas);
    cancelAnimationFrame(this.animationFrameId);
  },
  methods: {
    resizeCanvas() {
      this.$refs.canvas.width = window.innerWidth;
      this.$refs.canvas.height = window.innerHeight;
    },
    drawGrid() {
      this.ctx.strokeStyle = 'rgba(255, 69, 0, 0.1)';
      this.ctx.lineWidth = 1;

      const offsetX = Math.sin(this.time / 200) * this.gridSize;
      const offsetY = Math.cos(this.time / 200) * this.gridSize;

      for (let x = -this.gridSize + (offsetX % this.gridSize); x <= this.$refs.canvas.width; x += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.$refs.canvas.height);
        this.ctx.stroke();
      }
      for (let y = -this.gridSize + (offsetY % this.gridSize); y <= this.$refs.canvas.height; y += this.gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.$refs.canvas.width, y);
        this.ctx.stroke();
      }
    },
    animate() {
      this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
      this.time++;
      this.drawGrid();
      this.animationFrameId = requestAnimationFrame(this.animate);
    },
  },
};
</script>

<style scoped>
.dynamic-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}
</style>
