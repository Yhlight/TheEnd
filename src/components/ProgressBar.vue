<template>
  <div class="progress-bar-container">
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script>
export default {
  name: 'ProgressBar',
  props: {
    songTime: {
      type: Number,
      required: true,
    },
    songDuration: {
      type: Number,
      required: true,
    },
  },
  computed: {
    progress() {
      if (!this.songDuration) return 0;
      return (this.songTime / this.songDuration) * 100;
    },
  },
};
</script>

<style scoped>
.progress-bar-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 50;
}

.progress-bar {
  height: 100%;
  background-color: #fff;
  box-shadow: 0 0 10px #fff, 0 0 15px #ff00ff;
  transition: width 0.1s linear;
}
</style>
