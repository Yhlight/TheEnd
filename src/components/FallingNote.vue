<template>
  <div class="falling-note" :style="noteStyle" :class="noteTypeClass">
    <div v-if="noteData.type === 'hold'" class="hold-tail" :style="holdTailStyle">
      <div class="hold-fill" :style="holdFillStyle"></div>
    </div>
    <div v-if="noteData.type === 'swipe'" class="rhombus"></div>
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
    noteTypeClass() {
      return `note-${this.noteData.type}`;
    },
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
    }
  }
}
</script>

<style scoped>
.falling-note {
  position: absolute;
  width: 10%;
  height: 25px;
  background-color: #FF4500;
  border: 2px solid #FF4500;
  box-shadow: 0 0 15px #FF4500;
  transform-origin: center center;
}
.note-tap {
  border-radius: 4px;
}
.note-hold {
  border-radius: 8px;
}
.hold-tail {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  background: linear-gradient(rgba(255, 69, 0, 0.1), #FF4500);
  border-radius: 0 0 6px 6px;
}
.hold-fill {
  width: 100%;
  background-color: #FF4500;
  border-radius: 0 0 6px 6px;
}
.note-swipe {
  background-color: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
.rhombus {
  width: 25px;
  height: 25px;
  background-color: #FF00FF;
  border: 2px solid #FF00FF;
  box-shadow: 0 0 15px #FF00FF;
  transform: rotate(45deg);
}
.note-catch {
  background-color: transparent;
  border: none;
  box-shadow: none;
}
.note-catch::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: #FFD700;
  box-shadow: 0 0 15px #FFD700;
  transform: translateY(-50%);
}
</style>
