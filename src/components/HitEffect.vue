<template>
  <div class="hit-effect" :style="positionStyle">
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
    // noteType prop can be used in the future to customize shatter patterns
    noteType: { type: String, default: 'tap' },
  },
  data() {
    return {
      particles: [],
    };
  },
  mounted() {
    this.createParticles();
  },
  computed: {
    positionStyle() {
      return {
        top: `${this.y}%`,
        left: `${this.x}%`,
      };
    },
  },
  methods: {
    createParticles() {
      const count = this.judgment === 'perfect' ? 12 : 6;
      for (let i = 0; i < count; i++) {
        const size = 5 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const velocity = 20 + Math.random() * 30;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;

        this.particles.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            '--dx': dx,
            '--dy': dy,
            '--rotation': Math.random() * 360,
            animationDuration: `${0.6 + Math.random() * 0.4}s`,
          },
        });
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
  z-index: 20;
}

.particle {
  position: absolute;
  background-color: #fff;
  box-shadow: 0 0 10px #fff, 0 0 15px #00ffff;
  /* Use ease-out curve which is better for explosions */
  animation: shatter-anim ease-out forwards;
}

@keyframes shatter-anim {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    /* Apply gravity by adding a downward translation */
    transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px + 80px)) rotate(calc(var(--rotation) * 1deg));
    opacity: 0;
  }
}
</style>
