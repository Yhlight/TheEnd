<template>
  <div class="hit-effect" :style="{ left: x + '%', top: y + '%' }">
    <div v-for="i in 5" :key="i" class="particle" :style="particleStyle(i)"></div>
  </div>
</template>

<script>
export default {
  name: 'HitEffect',
  props: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  methods: {
    particleStyle(i) {
      // Give each particle a random direction and animation delay
      const angle = Math.random() * 360;
      const distance = 50 + Math.random() * 50;
      return {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        'animation-delay': `${i * 0.02}s`
      };
    }
  }
};
</script>

<style scoped>
.hit-effect {
  position: absolute;
  transform: translate(-50%, -50%);
}

.particle {
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: transparent;
  border: 2px solid #fff;
  box-shadow: 0 0 10px #fff, 0 0 15px #ff00ff;
  animation: shatter 0.5s ease-out forwards;
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
