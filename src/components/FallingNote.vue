<template>
  <div class="falling-note" :style="noteStyle">
    <div v-if="noteData.type === 'hold'" class="hold-tail" :style="holdTailStyle">
      <div class="hold-fill" :style="holdFillStyle"></div>
    </div>
    <div v-if="noteData.type === 'swipe'" class="swipe-arrow" :class="swipeDirection"></div>
  </div>
</template>

<script>
export default {
  name: 'FallingNote',
  props: {
    noteData: { type: Object, required: true },
    isHolding: { type: Boolean, default: false },
    songTime: { type: Number, required: true },
    lookaheadTime: { type: Number, required: true },
    judgmentLineYPercent: { type: Number, required: true }
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
      const judgmentLineYPx = window.innerHeight * (this.judgmentLineYPercent / 100);
      const fallSpeed = judgmentLineYPx / this.lookaheadTime;
      const height = this.noteData.duration * fallSpeed;
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
  width: 10%;
  height: 20px;
  background-color: #fff;
  border: 2px solid #0ff;
  box-shadow: 0 0 10px #0ff;
  transform-origin: center center;
}
.hold-tail {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  background: linear-gradient(rgba(0, 255, 255, 0.5), #0ff);
}
.hold-fill {
  width: 100%;
  background-color: #0ff;
}
.swipe-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
}
.swipe-left {
  border-right: 15px solid #ff00ff;
}
.swipe-right {
  border-left: 15px solid #ff00ff;
}
</style>
