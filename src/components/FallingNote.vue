<template>
  <div class="falling-note" :style="noteStyle"></div>
</template>

<script>
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
        animationDuration: `${this.noteData.duration}s`
      };
    }
  }
}
</script>

<style scoped>
.falling-note {
  position: absolute;
  top: -50px; /* Start above the screen */
  width: 80px;
  height: 30px;
  background-color: #FF00FF;
  box-shadow: 0 0 10px #FF00FF;
  animation: fall linear forwards;
}

@keyframes fall {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100vh);
  }
}
</style>
