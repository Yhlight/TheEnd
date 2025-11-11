<template>
  <div class="game-screen">
    <div class="grid-background"></div>
    <div v-if="!isPlaying" class="play-button-container">
      <button @click="startGame" :disabled="!chartLoaded">
        {{ chartLoaded ? 'Play' : 'Loading...' }}
      </button>
    </div>
    <div class="notes-container">
      <geometric-note
        v-for="note in visibleNotes"
        :key="note.id"
        :note-type="note.type"
        :style="{ top: note.y + '%', left: note.x + '%' }"
      />
    </div>
    <judgment-line :style="{ top: judgmentLinePosition + '%' }" />
    <audio ref="audioPlayer"></audio>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';
import JudgmentLine from './JudgmentLine.vue';

export default {
  name: 'GameScreen',
  components: {
    GeometricNote,
    JudgmentLine
  },
  data() {
    return {
      chart: null,
      notes: [],
      judgmentLinePosition: 85,
      isPlaying: false,
      chartLoaded: false,
      songTime: 0,
      lookaheadTime: 2000 // Notes will appear 2000ms before they should be hit
    };
  },
  computed: {
    visibleNotes() {
      // Filter notes to only include those that should be on screen
      return this.notes.filter(note => {
        const timeUntilHit = note.time - this.songTime;
        return timeUntilHit <= this.lookaheadTime && timeUntilHit > -50; // Show for a moment after passing
      });
    }
  },
  methods: {
    async loadChart() {
      try {
        const response = await fetch('/charts/sample.json');
        this.chart = await response.json();
        // We no longer need to initialize a 'y' position here
        this.notes = this.chart.notes;
        this.$refs.audioPlayer.src = this.chart.audioUrl;
        this.chartLoaded = true;
      } catch (error) {
        console.error("Failed to load chart:", error);
      }
    },
    startGame() {
      if (!this.chartLoaded) return;
      this.isPlaying = true;
      this.$refs.audioPlayer.play();
      requestAnimationFrame(this.gameLoop);
    },
    gameLoop() {
      if (!this.isPlaying) return;

      this.songTime = this.$refs.audioPlayer.currentTime * 1000;

      // Update the y-position of all notes based on the current song time
      this.notes.forEach(note => {
        const timeUntilHit = note.time - this.songTime;
        const progress = timeUntilHit / this.lookaheadTime;
        note.y = this.judgmentLinePosition * (1 - progress);
      });

      requestAnimationFrame(this.gameLoop);
    }
  },
  created() {
    this.loadChart();
  }
};
</script>

<style scoped>
.game-screen {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #000;
}

.play-button-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

button {
  padding: 15px 30px;
  font-size: 24px;
  background-color: #ff00ff;
  color: #fff;
  border: 2px solid #fff;
  cursor: pointer;
  box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff;
}

button:disabled {
  background-color: #555;
  cursor: not-allowed;
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
  box-shadow: inset 0 0 150px rgba(255, 0, 0, 0.3);
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
