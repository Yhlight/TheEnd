<template>
  <div class="game-screen">
    <FallingNote v-for="note in notes" :key="note.id" :note-data="note" />
    <div class="judgment-line"></div>
  </div>
</template>

<script>
import FallingNote from './FallingNote.vue';

export default {
  name: 'GameScreen',
  components: {
    FallingNote
  },
  data() {
    return {
      notes: []
    };
  },
  mounted() {
    // Spawn some sample notes for demonstration
    this.notes = [
      { id: 1, x: 20, duration: 2 },
      { id: 2, x: 40, duration: 2.5 },
      { id: 3, x: 60, duration: 1.8 },
      { id: 4, x: 80, duration: 2.2 }
    ];
  }
}
</script>

<style scoped>
.game-screen {
  width: 100vw;
  height: 100vh;
  background-color: #1A1A2E;
  overflow: hidden;
  position: relative;
}

.judgment-line {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 3px;
  background-color: #00FFFF;
  box-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF;
}
</style>
