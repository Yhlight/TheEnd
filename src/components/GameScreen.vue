<template>
  <div class="game-screen" @click="handleTap">
    <div class="grid-background"></div>
    <HUD :score="score" :combo="combo" v-if="isPlaying" />
    <div v-if="!isPlaying" class="play-button-container">
      <button @click.stop="startGame" :disabled="!chartLoaded">
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
    <hit-effect
      v-for="effect in activeEffects"
      :key="effect.id"
      :x="effect.x"
      :y="effect.y"
    />
    <judgment-line :style="{ top: judgmentLinePosition + '%' }" />
    <audio ref="audioPlayer"></audio>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';
import JudgmentLine from './JudgmentLine.vue';
import HitEffect from './HitEffect.vue';
import HUD from './HUD.vue';

const TIMING_WINDOWS = { perfect: 50, good: 100, miss: 200 };
let effectIdCounter = 0;

export default {
  name: 'GameScreen',
  components: { GeometricNote, JudgmentLine, HitEffect, HUD },
  data() {
    return {
      chart: null,
      notes: [],
      activeEffects: [],
      judgmentLinePosition: 85,
      isPlaying: false,
      chartLoaded: false,
      songTime: 0,
      lookaheadTime: 2000,
      score: 0,
      combo: 0,
    };
  },
  computed: {
    visibleNotes() {
      return this.notes.filter(note => {
        if (note.judged) return false;
        const timeUntilHit = note.time - this.songTime;
        return timeUntilHit <= this.lookaheadTime && timeUntilHit > -TIMING_WINDOWS.miss;
      });
    }
  },
  methods: {
    async loadChart() {
      try {
        const response = await fetch('/charts/sample.json');
        this.chart = await response.json();
        this.notes = this.chart.notes.map(note => ({ ...note, judged: false }));
        this.$refs.audioPlayer.src = this.chart.audioUrl;
        this.chartLoaded = true;
      } catch (error) {
        console.error("Failed to load chart:", error);
      }
    },
    startGame() {
      if (!this.chartLoaded) return;
      this.isPlaying = true;
      this.score = 0;
      this.combo = 0;
      this.notes.forEach(note => note.judged = false);
      this.$refs.audioPlayer.currentTime = 0;
      this.$refs.audioPlayer.play();
      requestAnimationFrame(this.gameLoop);
    },
    handleTap() {
      if (!this.isPlaying) return;
      const hittableNote = this.notes.find(note => {
        if (note.judged) return false;
        const timingError = Math.abs(note.time - this.songTime);
        return timingError <= TIMING_WINDOWS.good;
      });

      if (hittableNote) {
        hittableNote.judged = true;
        this.spawnHitEffect(hittableNote);
        const timingError = Math.abs(hittableNote.time - this.songTime);

        if (timingError <= TIMING_WINDOWS.perfect) {
          this.score += 100;
          this.combo++;
        } else {
          this.score += 50;
          this.combo++;
        }
      }
    },
    spawnHitEffect(note) {
      const newEffect = {
        id: effectIdCounter++,
        x: note.x,
        y: this.judgmentLinePosition
      };
      this.activeEffects.push(newEffect);
      setTimeout(() => {
        this.activeEffects = this.activeEffects.filter(e => e.id !== newEffect.id);
      }, 500);
    },
    gameLoop() {
      if (!this.isPlaying) return;
      this.songTime = this.$refs.audioPlayer.currentTime * 1000;
      this.notes.forEach(note => {
        if (note.judged) return;
        const timeUntilHit = note.time - this.songTime;
        if (timeUntilHit < -TIMING_WINDOWS.miss) {
          this.combo = 0;
          note.judged = true;
        } else {
          const progress = timeUntilHit / this.lookaheadTime;
          note.y = this.judgmentLinePosition * (1 - progress);
        }
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
/* Styles remain the same */
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
