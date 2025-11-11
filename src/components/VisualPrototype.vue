<template>
  <div class="visual-prototype">
    <div class="grid-background"></div>
    <div class="notes-container">
      <!-- Dynamically rendering notes based on component state -->
      <geometric-note
        v-for="note in notes"
        :key="note.id"
        :note-type="note.type"
        :style="{ top: note.y + '%', left: note.x + '%' }"
      />
    </div>
    <judgment-line :style="{ top: judgmentLinePosition + '%' }" />
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';
import JudgmentLine from './JudgmentLine.vue';

export default {
  name: 'VisualPrototype',
  components: {
    GeometricNote,
    JudgmentLine
  },
  data() {
    return {
      notes: [
        // Start notes above the screen
        { id: 1, type: 'tap', x: 20, y: -10 },
        { id: 2, type: 'hold', x: 35, y: -40 },
        { id: 3, type: 'swipe', x: 50, y: -70 },
        { id: 4, type: 'catch', x: 65, y: -100 }
      ],
      judgmentLinePosition: 85, // Positioned at 85% from the top
      lastFrameTime: null,
      fallSpeed: 15 // % of screen height per second
    };
  },
  methods: {
    gameLoop(currentTime) {
      if (!this.lastFrameTime) {
        this.lastFrameTime = currentTime;
      }
      // Calculate time elapsed since the last frame in seconds
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;

      // Update positions of all notes
      this.notes.forEach(note => {
        note.y += this.fallSpeed * deltaTime;
        // If a note goes off the bottom, reset it to the top
        if (note.y > 110) {
          note.y = -10;
        }
      });

      this.lastFrameTime = currentTime;
      // Request the next frame to create the loop
      requestAnimationFrame(this.gameLoop);
    }
  },
  mounted() {
    // Start the game loop as soon as the component is mounted
    this.gameLoop();
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
