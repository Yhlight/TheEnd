<template>
  <div class="hit-effect" :style="position">
    <div v-for="i in 5" :key="i" class="particle" :style="particleStyles[i-1]"></div>
  </div>
</template>

<script>
export default {
  name: 'HitEffect',
  props: ['x', 'y'],
  data() {
    return {
      particleStyles: []
    };
  },
  computed: {
    position() {
      return {
        top: `${this.y}px`,
        left: `${this.x}px`
      };
    }
  },
  created() {
    // Generate random styles for each particle
    for (let i = 0; i < 5; i++) {
      const size = Math.random() * 15 + 5;
      this.particleStyles.push({
        '--size': `${size}px`,
        '--x-end': `${Math.random() * 100 - 50}px`,
        '--y-end': `${Math.random() * 100 - 50}px`,
        'animation-duration': `${Math.random() * 0.5 + 0.3}s`
      });
    }
  }
};
</script>

<style scoped>
.hit-effect {
  position: absolute;
  pointer-events: none;
}
.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: white;
  border-radius: 50%;
  animation: burst ease-out forwards;
}

@keyframes burst {
  from {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(var(--x-end), var(--y-end)) scale(0);
    opacity: 0;
  }
}
</style>
