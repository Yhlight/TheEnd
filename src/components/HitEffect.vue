<template>
  <div class="hit-effect" :style="position" :class="accuracy">
    <div v-for="i in particleCount" :key="i" class="particle" :style="particleStyles[i-1]"></div>
  </div>
</template>

<script>
export default {
  name: 'HitEffect',
  props: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    accuracy: { type: String, default: 'good' }
  },
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
    },
    particleCount() {
      return this.accuracy === 'perfect' ? 10 : 5;
    }
  },
  created() {
    for (let i = 0; i < this.particleCount; i++) {
      const size = (this.accuracy === 'perfect' ? Math.random() * 20 + 10 : Math.random() * 15 + 5);
      const travelDistance = (this.accuracy === 'perfect' ? 150 : 100);
      this.particleStyles.push({
        '--size': `${size}px`,
        '--x-end': `${Math.random() * travelDistance - travelDistance / 2}px`,
        '--y-end': `${Math.random() * travelDistance - travelDistance / 2}px`,
        'animation-duration': `${Math.random() * 0.6 + 0.4}s`
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
.perfect .particle {
  background: #00FFFF; /* Cyan for perfect hits */
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
