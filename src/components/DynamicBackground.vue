<template>
  <canvas ref="canvas" class="dynamic-background"></canvas>
</template>

<script>
export default {
  name: 'DynamicBackground',
  data() {
    return {
      ctx: null,
      particles: [],
      animationFrameId: null,
    };
  },
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');
    this.resizeCanvas();
    this.createParticles();
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
    createParticles() {
      const particleCount = 30;
      for (let i = 0; i < particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.$refs.canvas.width,
          y: Math.random() * this.$refs.canvas.height,
          size: Math.random() * 8 + 2,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          shape: Math.random() > 0.5 ? 'square' : 'rhombus',
        });
      }
    },
    drawGrid() {
      const gridSize = 50;
      this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;

      for (let x = 0; x <= this.$refs.canvas.width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.$refs.canvas.height);
        this.ctx.stroke();
      }
      for (let y = 0; y <= this.$refs.canvas.height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.$refs.canvas.width, y);
        this.ctx.stroke();
      }
    },
    drawParticles() {
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        if (p.shape === 'rhombus') {
          this.ctx.rotate(45 * Math.PI / 180);
        }
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      });
    },
    updateParticles() {
      this.particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = this.$refs.canvas.width;
        if (p.x > this.$refs.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.$refs.canvas.height;
        if (p.y > this.$refs.canvas.height) p.y = 0;
      });
    },
    animate() {
      this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
      this.drawGrid();
      this.updateParticles();
      this.drawParticles();
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
