<template>
  <div class="hit-effect" :style="{ left: x + '%', top: y + '%' }">
    <div v-for="i in particleCount" :key="i" class="particle" :class="judgment" :style="particleStyle(i)"></div>
  </div>
</template>

<script>
export default {
  name: 'HitEffect',
  props: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    judgment: {
      type: String,
      default: 'good', // 'good' or 'perfect'
    },
  },
  computed: {
    particleCount() {
      return this.judgment === 'perfect' ? 8 : 5;
    },
  },
  methods: {
    particleStyle(i) {
      const angle = Math.random() * 360;
      const distance = 50 + Math.random() * 50;
      return {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        'animation-delay': `${i * 0.02}s`,
      };
    },
  },
};
</script>

<style scoped>
.hit-effect {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none; /* Prevent effects from capturing clicks */
}

.particle {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: transparent;
  border: 2px solid #fff;
  animation: shatter 0.5s ease-out forwards;
}

.particle.good {
  box-shadow: 0 0 10px #fff, 0 0 15px #ff00ff;
}

.particle.perfect {
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff, 0 0 35px #00ffff;
}

@keyframes shatter {
  0% {
    transform: rotate(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle)) translateX(var(--distance)) scale(0);
    opacity: 0;
  }
}
</style>
