<template>
  <div class="game-screen" @mousedown="handleInteraction" @mouseup="handleInteractionEnd" @mousemove="handleSwipe">
    <DynamicBackground />
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: songProgress + '%' }"></div>
    </div>
    <div class="ui-container">
      <div class="score">Score: {{ score }}</div>
      <div class="combo">Combo: {{ combo }}</div>
      <div class="settings-button" @click="showSettings = true">⚙️</div>
    </div>
    <SettingsMenu
      v-if="showSettings"
      v-model:volume="volume"
      v-model:noteSpeed="noteSpeed"
      @close="showSettings = false"
    />
    <div v-if="!isPlaying" class="start-button" @click="startGame">Play</div>
    <FallingNote
      v-for="note in activeNotes"
      :key="note.id"
      :note-data="note"
      :is-holding="activeHoldNote && activeHoldNote.id === note.id"
      :song-time="songTime"
+      :lookahead-time="lookaheadTime"
      :judgment-line-y-percent="judgmentLineY"
    />
    <HitEffect v-for="effect in hitEffects" :key="effect.id" :x="effect.x" :y="effect.y" :accuracy="effect.accuracy" />
    <div class="judgment-line" ref="judgmentLine" :class="judgmentLineClass" :style="judgmentLineStyle"></div>
    <audio ref="audioPlayer" :src="audioUrl" @ended="endGame"></audio>
    <audio ref="hitSound" src="/audio/hit.mp3"></audio>
  </div>
</template>

<script>
import FallingNote from './FallingNote.vue';
import HitEffect from './HitEffect.vue';
import DynamicBackground from './DynamicBackground.vue';
import SettingsMenu from './SettingsMenu.vue';
import { easingFunctions } from '../utils.js';

const PERFECT_WINDOW = 50;
const GOOD_WINDOW = 100;
const SWIPE_THRESHOLD = 50;

export default {
  name: 'GameScreen',
  components: {
    FallingNote,
    HitEffect,
    DynamicBackground,
    SettingsMenu
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
      nextHitEffectId: 0,
      showSettings: false,
      volume: 1.0,
      noteSpeed: 2000
    };
  },
  watch: {
    combo(newCombo) {
      if (newCombo > this.maxCombo) {
        this.maxCombo = newCombo;
      }
    },
    volume(newVolume) {
      this.$refs.audioPlayer.volume = newVolume;
      this.$refs.hitSound.volume = newVolume;
    }
  },
  computed: {
    lookaheadTime() {
      // Note speed is inverted: higher value means slower notes (more lookahead)
      return this.noteSpeed;
    },
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
    triggerHitEffect(x, y, accuracy = 'good') {
      this.hitEffects.push({ id: this.nextHitEffectId++, x, y, accuracy });
      this.$refs.hitSound.currentTime = 0;
      this.flashJudgmentLine(accuracy);
      this.$refs.hitSound.play();
      setTimeout(() => {
        this.hitEffects.shift();
      }, 1000);
    },
    flashJudgmentLine(accuracy) {
      this.judgmentLineClass = `flash-${accuracy}`;
      setTimeout(() => {
        this.judgmentLineClass = '';
      }, 150);
    },
    handleInteraction(event) {
      if (!this.isPlaying || this.showSettings) return;

      let closestNote = null;
      let minTimeDiff = Infinity;

      this.activeNotes.filter(n => n.type !== 'catch').forEach(note => {
        const timeDiff = Math.abs(this.songTime - note.time);
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestNote = note;
        }
      });

      if (closestNote && minTimeDiff <= GOOD_WINDOW) {
        let accuracy = 'good';
        if (minTimeDiff <= PERFECT_WINDOW) {
          accuracy = 'perfect';
        }

        if (closestNote.type === 'tap') {
          this.score += (accuracy === 'perfect' ? 100 : 50);
          this.combo++;
          this.activeNotes = this.activeNotes.filter(n => n.id !== closestNote.id);
          this.triggerHitEffect(event.clientX, event.clientY, accuracy);
        } else if (closestNote.type === 'hold') {
          this.activeHoldNote = closestNote;
          this.triggerHitEffect(event.clientX, event.clientY, accuracy);
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
          const accuracy = (timeDiff <= PERFECT_WINDOW) ? 'perfect' : 'good';
          this.score += (accuracy === 'perfect' ? 200 : 100);
          this.combo++;
          this.activeNotes = this.activeNotes.filter(n => n.id !== this.activeHoldNote.id);
          this.triggerHitEffect(event.clientX, event.clientY, accuracy);
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
            // Swipe accuracy is not time-based in this implementation
            this.score += 150;
            this.combo++;
            this.activeNotes = this.activeNotes.filter(n => n.id !== this.activeSwipeNote.id);
            this.triggerHitEffect(event.clientX, event.clientY, 'perfect');
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

      if (this.showSettings) {
        this.$refs.audioPlayer.pause();
        this.gameLoopId = requestAnimationFrame(this.gameLoop);
        return;
      } else {
        if (this.$refs.audioPlayer.paused) {
          this.$refs.audioPlayer.play();
        }
      }

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

      while (this.chart && this.noteSpawnIndex < this.chart.notes.length && this.chart.notes[this.noteSpawnIndex].time < this.songTime + this.lookaheadTime) {
        this.activeNotes.push({ ...this.chart.notes[this.noteSpawnIndex] });
        this.noteSpawnIndex++;
      }

      const judgmentLineRect = this.$refs.judgmentLine.getBoundingClientRect();
      const judgmentLineYPx = judgmentLineRect.top + judgmentLineRect.height / 2;
      this.activeNotes.forEach(note => {
        const timeToHit = note.time - this.songTime;
        const progress = 1 - (timeToHit / this.lookaheadTime);
        note.y = progress * judgmentLineYPx;
      });

      // Handle catch notes
      const judgedCatchNotes = [];
      this.activeNotes.forEach(note => {
        if (note.type === 'catch') {
          const timeDiff = Math.abs(this.songTime - note.time);
          if (timeDiff <= GOOD_WINDOW) { // Using GOOD_WINDOW for catch notes
            const noteWidth = 10; // From FallingNote.vue style
            const noteStartX = note.x - (noteWidth / 2);
            const noteEndX = note.x + (noteWidth / 2);

            if (this.judgmentLineX >= noteStartX && this.judgmentLineX <= noteEndX) {
              const accuracy = (timeDiff <= PERFECT_WINDOW) ? 'perfect' : 'good';
              this.score += 75; // Score for catching
              this.combo++;
              const effectX = (window.innerWidth * note.x) / 100;
              const effectY = judgmentLineRect.top;
              this.triggerHitEffect(effectX, effectY, accuracy);
              judgedCatchNotes.push(note.id);
            }
          }
        }
      });
      if (judgedCatchNotes.length > 0) {
        this.activeNotes = this.activeNotes.filter(n => !judgedCatchNotes.includes(n.id));
      }

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
.game-screen {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #050505; /* Near Black */
  overflow: hidden;
  color: #EAEAEA; /* Pale White */
  font-family: 'Arial', sans-serif;
}
.ui-container {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
  text-transform: uppercase;
  font-weight: bold;
}
.score, .combo {
  font-size: 28px;
  text-shadow: 0 0 10px #FF4500; /* Fiery Orange Glow */
}
.settings-button {
  font-size: 28px;
  cursor: pointer;
  text-shadow: 0 0 10px #FF4500;
}
.start-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 15px 30px;
  font-size: 32px;
  background-color: transparent;
  border: 3px solid #FF4500;
  color: #FF4500;
  text-transform: uppercase;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  box-shadow: 0 0 15px #FF4500;
}
.start-button:hover {
  background-color: #FF4500;
  color: #050505;
  box-shadow: 0 0 30px #FF4500;
}
.judgment-line {
  position: absolute;
  width: 100%;
  height: 4px;
  background-color: #FF4500;
  box-shadow: 0 0 20px #FF4500;
  transition: all 0.1s ease-out;
}
.judgment-line.flash-perfect {
  background-color: #FFFFFF;
  box-shadow: 0 0 30px #FFFFFF;
  transform: translateX(-50%) translateY(-50%) rotate(var(--rotation)) scale(1.05);
}
.judgment-line.flash-good {
  background-color: #FF4500;
  box-shadow: 0 0 25px #FF4500;
}
.progress-bar-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background-color: rgba(255, 69, 0, 0.2);
}
.progress-bar {
  height: 100%;
  background-color: #FF4500;
  box-shadow: 0 0 10px #FF4500;
}
</style>
