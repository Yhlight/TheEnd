<template>
  <div class="hit-effect" :style="{ left: x + '%', top: y + '%' }">
    <div
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :style="p.style"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'HitEffect',
  props: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    judgment: { type: String, default: 'good' },
  },
  data() {
    return {
      particles: [],
      animationFrameId: null,
    };
  },
  mounted() {
    this.createParticles();
    this.animate();
  },
  beforeDestroy() {
    cancelAnimationFrame(this.animationFrameId);
  },
  methods: {
    createParticles() {
      const particleCount = this.judgment === 'perfect' ? 15 : 8;
      const baseHue = this.judgment === 'perfect' ? 180 : 300; // Cyan for perfect, Magenta for good

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 4;
        const size = 5 + Math.random() * 10;

        this.particles.push({
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: size,
          opacity: 1,
          hue: baseHue + (Math.random() * 60 - 30),
          style: {}, // Will be populated by animate()
        });
      }
    },
    animate() {
      let allFaded = true;
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.02; // Fade out rate

        if (p.opacity > 0) {
          allFaded = false;
          p.style = {
            transform: `translate(${p.x}px, ${p.y}px)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            backgroundColor: `hsl(${p.hue}, 100%, 75%)`,
            boxShadow: `0 0 10px hsl(${p.hue}, 100%, 75%)`,
          };
        } else {
          p.opacity = 0;
        }
      });

      if (!allFaded) {
        this.animationFrameId = requestAnimationFrame(this.animate);
      }
    },
  },
};
</script>

<style scoped>
.hit-effect {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 2px; /* Slightly rounded squares */
}
</style>
