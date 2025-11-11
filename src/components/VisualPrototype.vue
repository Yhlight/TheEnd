<template>
  <div class="visual-prototype">
    <div class="grid-background"></div>
    <div class="notes-container">
      <!-- Displaying each note type for visual testing -->
      <geometric-note note-type="tap" style="top: 20%; left: 20%;" />
      <geometric-note note-type="hold" style="top: 40%; left: 35%;" />
      <geometric-note note-type="swipe" style="top: 60%; left: 50%;" />
      <geometric-note note-type="catch" style="top: 80%; left: 65%;" />
    </div>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';

export default {
  name: 'VisualPrototype',
  components: {
    GeometricNote
  }
};
</script>

<style scoped>
.visual-prototype {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #000; /* Ensure background is black */
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: moveGrid 20s linear infinite;
  box-shadow: inset 0 0 150px rgba(255, 0, 0, 0.3); /* Inner glow */
  opacity: 0.5;
}

.notes-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
}

@keyframes moveGrid {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 100px 100px;
  }
}
</style>
