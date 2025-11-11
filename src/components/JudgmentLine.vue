<template>
  <div class="judgment-line" :class="{ flash: flash }" :style="lineStyle"></div>
</template>

<script>
export default {
  name: 'JudgmentLine',
  props: {
    y: {
      type: Number,
      required: true,
    },
    rotation: {
      type: Number,
      default: 0,
    },
    flash: {
      type: Boolean,
      default: false,
    }
  },
  computed: {
    lineStyle() {
      return {
        top: `${this.y}%`,
        transform: `rotate(${this.rotation}deg)`,
      };
    },
  },
};
</script>

<style scoped>
.judgment-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: #fff;
  box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff;
  transition: box-shadow 0.1s; /* Smooth transitions for the glow */
}

.judgment-line.flash {
  animation: flash-anim 0.2s ease-out;
}

@keyframes flash-anim {
  0% {
    box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff;
  }
  50% {
    box-shadow: 0 0 30px #fff, 0 0 50px #00ffff;
    background-color: #aaf;
  }
  100% {
    box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff;
  }
}
</style>
