<template>
  <div class="game-screen" @mousedown="handleInteraction" @mouseup="handleInteractionEnd" @mousemove="handleSwipe">
    <div class="ui-container">
      <div class="score">Score: {{ score }}</div>
      <div class="combo">Combo: {{ combo }}</div>
    </div>
    <div v-if="!isPlaying" class="start-button" @click="startGame">Play</div>
    <FallingNote v-for="note in activeNotes" :key="note.id" :note-data="note" />
    <div class="judgment-line" ref="judgmentLine" :class="judgmentLineClass" :style="judgmentLineStyle"></div>
    <audio ref="audioPlayer" :src="audioUrl"></audio>
  </div>
</template>

<script>
import FallingNote from './FallingNote.vue';
import { easingFunctions } from '../utils.js';

const LOOKAHEAD_TIME = 2000; // ms
const PERFECT_WINDOW = 50; // ms
const GOOD_WINDOW = 100;  // ms
const SWIPE_THRESHOLD = 50; // pixels

export default {
  name: 'GameScreen',
  components: {
    FallingNote
  },
  data() {
    return {
      activeNotes: [],
      gameLoopId: null,
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
      initialLineState: {},
      isPlaying: false,
      activeHoldNote: null,
      activeSwipeNote: null,
      swipeStartX: 0
    };
  },
  computed: {
    judgmentLineStyle() {
      return {
        top: `${this.judgmentLineY}%`,
        left: `${this.judgmentLineX}%`,
        transform: `translateX(-50%) translateY(-50%) rotate(${this.judgmentLineRotation}deg)`
      };
    },
    audioUrl() {
      return this.chart ? this.chart.metadata.audioUrl : '';
    }
  },
  async mounted() {
    await this.loadChart('sample-chart.json');
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
    startGame() {
      this.$refs.audioPlayer.play();
      this.isPlaying = true;
      this.startGameLoop();
    },
    handleInteraction(event) {
      if (!this.isPlaying) return;

      let closestNote = null;
      let minTimeDiff = Infinity;

      this.activeNotes.forEach(note => {
        const timeDiff = Math.abs(this.songTime - note.time);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestNote = note;
        }
      });

      if (closestNote && minTimeDiff <= GOOD_WINDOW) {
        if (closestNote.type === 'tap') {
          if (minTimeDiff <= PERFECT_WINDOW) {
            this.score += 100;
          } else {
            this.score += 50;
          }
          this.combo++;
          this.activeNotes = this.activeNotes.filter(n => n.id !== closestNote.id);
        } else if (closestNote.type === 'hold') {
          this.activeHoldNote = closestNote;
        } else if (closestNote.type === 'swipe') {
          this.activeSwipeNote = closestNote;
          this.swipeStartX = event.clientX;
        }
      } else {
        this.combo = 0;
      }
    },
    handleInteractionEnd() {
      if (this.activeHoldNote) {
        const timeDiff = Math.abs(this.songTime - (this.activeHoldNote.time + this.activeHoldNote.duration));
        if (timeDiff <= GOOD_WINDOW) {
          if (timeDiff <= PERFECT_WINDOW) {
            this.score += 200;
          } else {
            this.score += 100;
          }
          this.combo++;
          this.activeNotes = this.activeNotes.filter(n => n.id !== this.activeHoldNote.id);
        } else {
          this.combo = 0;
        }
        this.activeHoldNote = null;
      }
      this.activeSwipeNote = null;
    },
    handleSwipe(event) {
      if (this.activeSwipeNote) {
        const distance = event.clientX - this.swipeStartX;
        if (Math.abs(distance) >= SWIPE_THRESHOLD) {
          const direction = distance > 0 ? 'right' : 'left';
          if (direction === this.activeSwipeNote.direction) {
            this.score += 150;
            this.combo++;
            this.activeNotes = this.activeNotes.filter(n => n.id !== this.activeSwipeNote.id);
          } else {
            this.combo = 0;
          }
          this.activeSwipeNote = null;
        }
      }
    },
    startGameLoop() {
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    },
    stopGameLoop() {
      cancelAnimationFrame(this.gameLoopId);
    },
    gameLoop() {
      if (!this.isPlaying) return;

      this.songTime = this.$refs.audioPlayer.currentTime * 1000;

      // Event Processing
      if (this.chart && this.eventIndex < this.chart.events.length) {
        const nextEvent = this.chart.events[this.eventIndex];
        if (this.songTime >= nextEvent.time) {
          this.activeEvent = nextEvent;
          this.initialLineState = { x: this.judgmentLineX, y: this.judgmentLineY, rotation: this.judgmentLineRotation };
          this.eventIndex++;
        }
      }
      if (this.activeEvent) {
        const progress = Math.min(1, (this.songTime - this.activeEvent.time) / this.activeEvent.duration);
        const easing = easingFunctions[this.activeEvent.easing] || easingFunctions.linear;
        const easedProgress = easing(progress);
        if (this.activeEvent.targetX !== undefined) this.judgmentLineX = this.initialLineState.x + (this.activeEvent.targetX - this.initialLineState.x) * easedProgress;
        if (this.activeEvent.targetY !== undefined) this.judgmentLineY = this.initialLineState.y + (this.activeEvent.targetY - this.initialLineState.y) * easedProgress;
        if (this.activeEvent.targetRotation !== undefined) this.judgmentLineRotation = this.initialLineState.rotation + (this.activeEvent.targetRotation - this.initialLineState.rotation) * easedProgress;
        if (progress >= 1) this.activeEvent = null;
      }

      // Note Spawning
      while (this.chart && this.noteSpawnIndex < this.chart.notes.length && this.chart.notes[this.noteSpawnIndex].time < this.songTime + LOOKAHEAD_TIME) {
        this.activeNotes.push({ ...this.chart.notes[this.noteSpawnIndex] });
        this.noteSpawnIndex++;
      }

      // Note Position Update
      const judgmentLineRect = this.$refs.judgmentLine.getBoundingClientRect();
      const judgmentLineY = judgmentLineRect.top + judgmentLineRect.height / 2;
      this.activeNotes.forEach(note => {
        const timeToHit = note.time - this.songTime;
        const progress = 1 - (timeToHit / LOOKAHEAD_TIME);
        note.y = progress * judgmentLineY;
      });

      // Missed Note Handling
      const missedNotes = this.activeNotes.filter(note => note.time < this.songTime - GOOD_WINDOW && note.type !== 'hold');
      if (missedNotes.length > 0) {
        this.combo = 0;
        this.activeNotes = this.activeNotes.filter(note => !missedNotes.includes(note));
      }
      if (this.activeHoldNote && this.songTime > this.activeHoldNote.time + this.activeHoldNote.duration + GOOD_WINDOW) {
        this.combo = 0;
        this.activeNotes = this.activeNotes.filter(n => n.id !== this.activeHoldNote.id);
        this.activeHoldNote = null;
      }

      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
  }
}
</script>

<style scoped>
.game-screen { width: 100vw; height: 100vh; background-color: #1A1A2E; overflow: hidden; position: relative; color: white; font-family: sans-serif; }
.ui-container { position: absolute; top: 20px; left: 20px; text-align: left; z-index: 10; }
.score { font-size: 24px; }
.combo { font-size: 36px; font-weight: bold; }
.judgment-line { position: absolute; width: 80%; height: 3px; background-color: #00FFFF; box-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF; }
.start-button { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px 40px; background-color: #00FFFF; color: #1A1A2E; font-size: 30px; font-weight: bold; cursor: pointer; border-radius: 10px; }
</style>
