<template>
  <div :class="['note', note.type]" :style="noteStyle">
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
    holdProgress: { type: Number, default: 0 } // 0 to 1
  },
  computed: {
    noteStyle() {
      if (this.note.type === 'hold' && this.note.duration > 0) {
        const noteSpeed = (this.viewportHeight * 0.85) / this.lookaheadTime;
        const lengthInPixels = this.note.duration * noteSpeed;
        return {
          height: `${lengthInPixels}px`,
          transform: `translateY(${-lengthInPixels}px)`
        };
      }
      return {};
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
  box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff, inset 0 0 10px #fff;
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
  box-shadow: 0 0 15px #ff00ff;
  opacity: 0.8;
}
.tap {
  /* Default shape */
}
.swipe {
  transform: rotate(45deg);
}
.catch {
  width: 120px;
  height: 4px;
  border: none;
  background-color: #fff;
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff;
}
</style>
