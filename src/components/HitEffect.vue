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
      const isPerfect = this.judgment === 'perfect';
      const particleCount = isPerfect ? 25 : 12;
      const baseHue = isPerfect ? 180 : 300; // Cyan for perfect, Magenta for good
      const gravity = 0.15;

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = isPerfect ? 4 + Math.random() * 5 : 3 + Math.random() * 4;
        const size = 3 + Math.random() * 6;

        this.particles.push({
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: size,
          opacity: 1,
          gravity: gravity,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 10 - 5,
          hue: baseHue + (Math.random() * 40 - 20),
          style: {}, // Will be populated by animate()
        });
      }
    },
    animate() {
      let allFaded = true;
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity; // Apply gravity
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.025; // Faster fade out

        if (p.opacity > 0) {
          allFaded = false;
          const isPerfect = this.judgment === 'perfect';
          const glow = isPerfect ? 15 : 8;
          p.style = {
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            backgroundColor: `hsl(${p.hue}, 100%, 75%)`,
            boxShadow: `0 0 ${glow}px hsl(${p.hue}, 100%, 75%)`,
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
  border-radius: 0; /* Sharp squares */
}
</style>
