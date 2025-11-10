<template>
  <div class="falling-note" :style="noteStyle">
    <div v-if="noteData.type === 'hold'" class="hold-tail" :style="holdTailStyle">
      <div class="hold-fill" :style="holdFillStyle"></div>
    </div>
    <div v-if="noteData.type === 'swipe'" class="swipe-arrow" :class="swipeDirection"></div>
  </div>
</template>

<script>
const LOOKAHEAD_TIME = 2000; // ms

export default {
  name: 'FallingNote',
  props: {
    noteData: {
      type: Object,
      required: true
    },
    isHolding: {
      type: Boolean,
      default: false
    },
    songTime: {
      type: Number,
      required: true
    }
  },
  computed: {
    noteStyle() {
      return {
        left: `${this.noteData.x}%`,
        transform: `translateY(${this.noteData.y}px)`
      };
    },
    holdTailStyle() {
      if (this.noteData.type !== 'hold') return {};
      const fallSpeed = (window.innerHeight * 0.85) / LOOKAHEAD_TIME;
      const height = (this.noteData.duration / 1000) * fallSpeed * 100;
      return {
        height: `${height}px`
      };
    },
    holdFillStyle() {
      if (!this.isHolding || this.noteData.type !== 'hold') return { height: '0%' };
      const holdProgress = (this.songTime - this.noteData.time) / this.noteData.duration;
      return {
        height: `${Math.min(100, holdProgress * 100)}%`
      };
    },
    swipeDirection() {
      if (this.noteData.type !== 'swipe') return '';
      return `swipe-${this.noteData.direction}`;
    }
  }
}
</script>

<style scoped>
.falling-note {
  position: absolute;
  top: 0;
  width: 80px;
  height: 30px;
  background-color: #FF00FF;
  box-shadow: 0 0 10px #FF00FF;
  border-radius: 5px;
  transform-origin: center;
}

.hold-tail {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  background-color: rgba(255, 0, 255, 0.5);
  border-radius: 5px;
  overflow: hidden;
}

.hold-fill {
  width: 100%;
  background-color: #FFFFFF;
  box-shadow: 0 0 10px #FFFFFF;
  position: absolute;
  bottom: 0;
}

.swipe-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 20px;
  height: 20px;
  border-top: 5px solid white;
  border-right: 5px solid white;
}

.swipe-left {
  transform: translate(-50%, -50%) rotate(-135deg);
}

.swipe-right {
  transform: translate(-50%, -50%) rotate(45deg);
}
</style>
