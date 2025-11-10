<template>
  <div class="game-screen" @mousedown="handleInteraction">
    <div class="ui-container">
      <div class="score">Score: {{ score }}</div>
      <div class="combo">Combo: {{ combo }}</div>
    </div>
    <FallingNote v-for="note in activeNotes" :key="note.id" :note-data="note" />
    <div class="judgment-line" ref="judgmentLine" :class="judgmentLineClass" :style="judgmentLineStyle"></div>
  </div>
</template>

<script>
import FallingNote from './FallingNote.vue';
import { easingFunctions, distanceToLineSegment } from '../utils.js';

const NOTE_SPEED = 200; // Pixels per second
const PERFECT_WINDOW = 25; // Distance in pixels
const GOOD_WINDOW = 50;  // Distance in pixels

export default {
  name: 'GameScreen',
  components: {
    FallingNote
  },
  data() {
    return {
      activeNotes: [],
      gameLoopId: null,
      lastFrameTime: null,
      judgmentLineClass: '',
      score: 0,
      combo: 0,
      chart: null,
      songTime: 0,
      noteSpawnIndex: 0,
      eventIndex: 0,
      judgmentLineX: 50,
      judgmentLineY: 85,
      judgmentLineRotation: 0,
      activeEvent: null,
      initialLineState: {}
    };
  },
  computed: {
    judgmentLineStyle() {
      return {
        top: `${this.judgmentLineY}%`,
        left: `${this.judgmentLineX}%`,
        transform: `translateX(-50%) translateY(-50%) rotate(${this.judgmentLineRotation}deg)`
      };
    }
  },
  async mounted() {
    await this.loadChart('sample-chart.json');
    this.startGameLoop();
  },
  beforeUnmount() {
    this.stopGameLoop();
  },
  methods: {
    async loadChart(chartName) {
      try {
        const response = await fetch(`/charts/${chartName}`);
        this.chart = await response.json();
      } catch (error) {
        console.error('Error loading chart:', error);
      }
    },
    handleInteraction() {
      const lineRect = this.$refs.judgmentLine.getBoundingClientRect();
      const angle = this.judgmentLineRotation * (Math.PI / 180);
      const halfWidth = lineRect.width / 2;
      const lineStart = {
        x: lineRect.left + halfWidth - halfWidth * Math.cos(angle),
        y: lineRect.top + lineRect.height / 2 - halfWidth * Math.sin(angle)
      };
      const lineEnd = {
        x: lineRect.left + halfWidth + halfWidth * Math.cos(angle),
        y: lineRect.top + lineRect.height / 2 + halfWidth * Math.sin(angle)
      };

      let closestNote = null;
      let minDistance = Infinity;

      this.activeNotes.forEach(note => {
        const noteCenter = { x: note.x / 100 * window.innerWidth, y: note.y };
        const distance = distanceToLineSegment(noteCenter, lineStart, lineEnd);
        if (distance < minDistance) {
          minDistance = distance;
          closestNote = note;
        }
      });

      if (closestNote && minDistance <= GOOD_WINDOW) {
        if (minDistance <= PERFECT_WINDOW) {
          this.score += 100;
        } else {
          this.score += 50;
        }
        this.combo++;
        this.activeNotes = this.activeNotes.filter(n => n.id !== closestNote.id);
      } else {
        this.combo = 0;
      }
    },
    startGameLoop() {
      this.lastFrameTime = performance.now();
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    },
    stopGameLoop() {
      cancelAnimationFrame(this.gameLoopId);
    },
    gameLoop(currentTime) {
      const deltaTime = (currentTime - this.lastFrameTime);
      this.songTime += deltaTime;
      this.lastFrameTime = currentTime;

      // Event Processing
      if (this.chart && this.eventIndex < this.chart.events.length) {
        const nextEvent = this.chart.events[this.eventIndex];
        if (this.songTime >= nextEvent.time) {
          this.activeEvent = nextEvent;
          this.initialLineState = {
            x: this.judgmentLineX,
            y: this.judgmentLineY,
            rotation: this.judgmentLineRotation
          };
          this.eventIndex++;
        }
      }

      if (this.activeEvent) {
        const progress = Math.min(1, (this.songTime - this.activeEvent.time) / this.activeEvent.duration);
        const easing = easingFunctions[this.activeEvent.easing] || easingFunctions.linear;
        const easedProgress = easing(progress);

        if (this.activeEvent.targetX !== undefined) {
          this.judgmentLineX = this.initialLineState.x + (this.activeEvent.targetX - this.initialLineState.x) * easedProgress;
        }
        if (this.activeEvent.targetY !== undefined) {
          this.judgmentLineY = this.initialLineState.y + (this.activeEvent.targetY - this.initialLineState.y) * easedProgress;
        }
        if (this.activeEvent.targetRotation !== undefined) {
          this.judgmentLineRotation = this.initialLineState.rotation + (this.activeEvent.targetRotation - this.initialLineState.rotation) * easedProgress;
        }

        if (progress >= 1) {
          this.activeEvent = null;
        }
      }

      // Note Spawning
      if (this.chart && this.noteSpawnIndex < this.chart.notes.length) {
        const nextNote = this.chart.notes[this.noteSpawnIndex];
        const timeToJudgment = (this.judgmentLineY / 100 * window.innerHeight) / NOTE_SPEED * 1000;
        if (this.songTime >= nextNote.time - timeToJudgment) {
          this.activeNotes.push({ ...nextNote, y: 0 });
          this.noteSpawnIndex++;
        }
      }

      // Note Position Update
      this.activeNotes.forEach(note => {
        note.y += NOTE_SPEED * (deltaTime / 1000);
      });

      // Missed Note Handling
      const missedNotes = this.activeNotes.filter(note => note.y > window.innerHeight);
      if (missedNotes.length > 0) {
        this.combo = 0;
        this.activeNotes = this.activeNotes.filter(note => !missedNotes.includes(note));
      }

      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
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
  color: white;
  font-family: sans-serif;
}
.ui-container {
  position: absolute;
  top: 20px;
  left: 20px;
  text-align: left;
  z-index: 10;
}
.score {
  font-size: 24px;
}
.combo {
  font-size: 36px;
  font-weight: bold;
}
.judgment-line {
  position: absolute;
  width: 80%;
  height: 3px;
  background-color: #00FFFF;
  box-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF;
}
</style>
