<template>
  <div class="judgment-line" :class="{ flash: flash }" :style="lineStyle">
    <div class="shockwave" :class="{ active: showShockwave }"></div>
  </div>
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
    },
    showShockwave: {
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
  box-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #ff00ff,
    0 0 30px #ff00ff,
    0 0 40px #ff00ff;
  transition: box-shadow 0.1s, background-color 0.1s;
}

.judgment-line.flash {
  animation: flash-anim 0.2s ease-out;
}

.shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background-color: #00ffff;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
}

.shockwave.active {
  animation: shockwave-anim 0.5s ease-out;
}

@keyframes shockwave-anim {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(30);
    opacity: 0;
  }
}

@keyframes flash-anim {
  0% {
    box-shadow:
      0 0 5px #fff,
      0 0 10px #fff,
      0 0 20px #ff00ff,
      0 0 30px #ff00ff,
      0 0 40px #ff00ff;
  }
  50% {
    background-color: #ccf;
    box-shadow:
      0 0 10px #fff,
      0 0 20px #fff,
      0 0 30px #00ffff,
      0 0 50px #00ffff,
      0 0 80px #00ffff;
  }
  100% {
    box-shadow:
      0 0 5px #fff,
      0 0 10px #fff,
      0 0 20px #ff00ff,
      0 0 30px #ff00ff,
      0 0 40px #ff00ff;
  }
}
</style>
