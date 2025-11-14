<template>
  <div v-if="!shattered" :class="['note', note.type]" :style="noteStyle">
    <div v-if="note.type === 'hold'" class="hold-progress" :style="{ height: holdProgressPercentage }"></div>
  </div>
</template>

<script>
export default {
  name: 'GeometricNote',
  props: {
    note: { type: Object, required: true },
    lookaheadTime: { type: Number, required: true },
    viewportHeight: { type: Number, required: true },
    holdProgress: { type: Number, default: 0 }, // 0 to 1
    noteSize: { type: Number, default: 100 },
    shattered: { type: Boolean, default: false }
  },
  computed: {
    noteStyle() {
      const scale = this.noteSize / 100;
      let style = {
        transform: `scale(${scale})`
      };

      if (this.note.type === 'hold' && this.note.duration > 0) {
        const noteSpeed = (this.viewportHeight * 0.85) / this.lookaheadTime;
        const lengthInPixels = this.note.duration * noteSpeed;
        style.height = `${lengthInPixels}px`;
        style.transform += ` translateY(${-lengthInPixels}px)`;
      }

      if (this.note.type === 'swipe') {
        style.transform += ' rotate(45deg)';
      }

      return style;
    },
    holdProgressPercentage() {
      return `${this.holdProgress * 100}%`;
    }
  }
};
</script>

<style scoped>
.note {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 4px solid #fff;
  box-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #ff00ff,
    inset 0 0 10px rgba(255, 255, 255, 0.8);
}
.hold {
  border-radius: 10px;
  overflow: hidden;
}
.hold-progress {
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: #ff00ff;
  box-shadow: 0 0 15px #ff00ff, 0 0 25px #ff00ff;
  opacity: 0.8;
}
.tap {
  /* Default shape */
}
.swipe {
  /* box-shadow doesn't work well with rotated elements, use filter */
  filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 15px #ff00ff);
  /* Reset box-shadow and border for swipe to avoid visual glitches */
  box-shadow: none;
  border: 4px solid #fff;
  background-color: rgba(0, 0, 0, 0.8);
}
.catch {
  width: 120px;
  height: 4px;
  border: none;
  background-color: #fff;
  box-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #00ffff,
    0 0 30px #00ffff;
}
</style>
