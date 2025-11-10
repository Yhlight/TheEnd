<template>
  <div class="game-screen" @mousedown="handleInteraction" @mouseup="handleInteractionEnd" @mousemove="handleSwipe">
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: songProgress + '%' }"></div>
    </div>
    <div class="ui-container">
      <div class="score">Score: {{ score }}</div>
      <div class="combo">Combo: {{ combo }}</div>
    </div>
    <div v-if="!isPlaying" class="start-button" @click="startGame">Play</div>
    <FallingNote
      v-for="note in activeNotes"
      :key="note.id"
      :note-data="note"
      :is-holding="activeHoldNote && activeHoldNote.id === note.id"
      :song-time="songTime"
    />
    <HitEffect v-for="effect in hitEffects" :key="effect.id" :x="effect.x" :y="effect.y" />
    <div class="judgment-line" ref="judgmentLine" :class="judgmentLineClass" :style="judgmentLineStyle"></div>
    <audio ref="audioPlayer" :src="audioUrl" @ended="endGame"></audio>
    <audio ref="hitSound" src="/audio/hit.mp3"></audio>
  </div>
</template>

<script>
import FallingNote from './FallingNote.vue';
import HitEffect from './HitEffect.vue';
import { easingFunctions } from '../utils.js';

const LOOKAHEAD_TIME = 2000;
const PERFECT_WINDOW = 50;
const GOOD_WINDOW = 100;
const SWIPE_THRESHOLD = 50;

export default {
  name: 'GameScreen',
  components: {
    FallingNote,
    HitEffect
  },
  data() {
    return {
      activeNotes: [],
      gameLoopId: null,
      judgmentLineClass: '',
      score: 0,
      combo: 0,
      maxCombo: 0,
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
      swipeStartX: 0,
      hitEffects: [],
      nextHitEffectId: 0
    };
  },
  watch: {
    combo(newCombo) {
      if (newCombo > this.maxCombo) {
        this.maxCombo = newCombo;
      }
    }
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
    },
    songProgress() {
      if (!this.isPlaying || !this.$refs.audioPlayer || !this.$refs.audioPlayer.duration) return 0;
      return (this.$refs.audioPlayer.currentTime / this.$refs.audioPlayer.duration) * 100;
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
    endGame() {
      this.stopGameLoop();
      this.isPlaying = false;
      this.$emit('game-ended', { score: this.score, combo: this.maxCombo });
    },
    triggerHitEffect(x, y) {
      this.hitEffects.push({ id: this.nextHitEffectId++, x, y });
      this.$refs.hitSound.currentTime = 0;
      this.$refs.hitSound.play();
      setTimeout(() => {
        this.hitEffects.shift();
      }, 1000);
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
          if (minTimeDiff <= PERFECT_WINDOW) this.score += 100;
          else this.score += 50;
          this.combo++;
          this.activeNotes = this.activeNotes.filter(n => n.id !== closestNote.id);
          this.triggerHitEffect(event.clientX, event.clientY);
        } else if (closestNote.type === 'hold') {
          this.activeHoldNote = closestNote;
          this.triggerHitEffect(event.clientX, event.clientY);
        } else if (closestNote.type === 'swipe') {
          this.activeSwipeNote = closestNote;
          this.swipeStartX = event.clientX;
        }
      } else {
        this.combo = 0;
      }
    },
    handleInteractionEnd(event) {
      if (this.activeHoldNote) {
        const timeDiff = Math.abs(this.songTime - (this.activeHoldNote.time + this.activeHoldNote.duration));
        if (timeDiff <= GOOD_WINDOW) {
          if (timeDiff <= PERFECT_WINDOW) this.score += 200;
          else this.score += 100;
          this.combo++;
          this.activeNotes = this.activeNotes.filter(n => n.id !== this.activeHoldNote.id);
          this.triggerHitEffect(event.clientX, event.clientY);
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
            this.triggerHitEffect(event.clientX, event.clientY);
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

      while (this.chart && this.noteSpawnIndex < this.chart.notes.length && this.chart.notes[this.noteSpawnIndex].time < this.songTime + LOOKAHEAD_TIME) {
        this.activeNotes.push({ ...this.chart.notes[this.noteSpawnIndex] });
        this.noteSpawnIndex++;
      }

      const judgmentLineRect = this.$refs.judgmentLine.getBoundingClientRect();
      const judgmentLineY = judgmentLineRect.top + judgmentLineRect.height / 2;
      this.activeNotes.forEach(note => {
        const timeToHit = note.time - this.songTime;
        const progress = 1 - (timeToHit / LOOKAHEAD_TIME);
        note.y = progress * judgmentLineY;
      });

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
/* ... styles ... */
</style>
