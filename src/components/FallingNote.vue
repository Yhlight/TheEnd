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
        transform: `translateY(${this.noteData.y}px)`
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
}
</style>
