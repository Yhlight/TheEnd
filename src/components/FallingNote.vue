<template>
  <div class="falling-note" :style="noteStyle">
    <div v-if="noteData.type === 'hold'" class="hold-tail" :style="holdTailStyle"></div>
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
      // This calculation is an approximation and might need refinement.
      // It assumes a constant fall speed derived from LOOKAHEAD_TIME.
      const fallSpeed = (window.innerHeight * 0.85) / LOOKAHEAD_TIME;
      const height = (this.noteData.duration / 1000) * fallSpeed * 100;
      return {
        height: `${height}px`
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
  background-color: #FF00FF;
  box-shadow: 0 0 10px #FF00FF;
  border-radius: 5px;
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
