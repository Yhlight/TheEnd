<template>
  <div
    class="game-screen"
    @pointerdown="handleInteractionStart"
    @pointerup="handleInteractionEnd"
    @pointerleave="handleInteractionEnd"
    @pointermove="handleInteractionMove"
  >
    <div class="grid-background"></div>
    <progress-bar :song-time="songTime" :song-duration="songDuration" v-if="isPlaying" />
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
        :note="note"
        :lookahead-time="lookaheadTime"
        :viewport-height="viewportHeight"
        :hold-progress="note.holdProgress"
        :style="{ top: note.y + '%', left: note.x + '%' }"
      />
    </div>
    <hit-effect
      v-for="effect in activeEffects"
      :key="effect.id"
      :x="effect.x"
      :y="effect.y"
      :judgment="effect.judgment"
    />
    <judgment-line :y="judgmentLinePosition" :rotation="judgmentLineRotation" :flash="lineFlashing" />
    <audio ref="audioPlayer" @loadedmetadata="onSongLoaded"></audio>
    <audio ref="hitSfxPlayer" src="/audio/hit.mp3"></audio>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';
import JudgmentLine from './JudgmentLine.vue';
import HitEffect from './HitEffect.vue';
import HUD from './HUD.vue';
import ProgressBar from './ProgressBar.vue';

const TIMING_WINDOWS = { perfect: 50, good: 100, miss: 200 };
let effectIdCounter = 0;

export default {
  name: 'GameScreen',
  components: { GeometricNote, JudgmentLine, HitEffect, HUD, ProgressBar },
  data() {
    return {
      chart: null,
      notes: [],
      activeEffects: [],
      activeHolds: {},
      isDragging: false,
      judgmentLinePosition: 85,
      judgmentLineRotation: 0,
      isPlaying: false,
      chartLoaded: false,
      songTime: 0,
      songDuration: 0,
      lookaheadTime: 2000,
      score: 0,
      combo: 0,
      lineFlashing: false,
      viewportHeight: 0,
    };
  },
  mounted() {
    this.viewportHeight = window.innerHeight;
  },
  computed: {
    visibleNotes() {
      return this.notes.filter(note => {
        if (note.judged && !note.active) return false;
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
        this.notes = this.chart.notes.map(note => ({ ...note, judged: false, active: false, holdProgress: 0 }));
        if (this.chart.events && this.chart.events.length > 0) {
          this.judgmentLinePosition = this.chart.events[0].y;
          this.judgmentLineRotation = this.chart.events[0].rotation;
        }
        this.$refs.audioPlayer.src = this.chart.audioUrl;
        this.chartLoaded = true;
      } catch (error) {
        console.error("Failed to load chart:", error);
      }
    },
    onSongLoaded() {
      if (this.$refs.audioPlayer) {
        this.songDuration = this.$refs.audioPlayer.duration * 1000;
      }
    },
    startGame() {
      if (!this.chartLoaded) return;
      this.isPlaying = true;
      this.score = 0;
      this.combo = 0;
      this.activeHolds = {};
      this.notes.forEach(note => {
        note.judged = false;
        note.active = false;
        note.holdProgress = 0;
      });
      this.$refs.audioPlayer.currentTime = 0;
      this.$refs.audioPlayer.play();
      requestAnimationFrame(this.gameLoop);
    },
    handleInteractionStart(event) {
      if (!this.isPlaying) return;
      this.isDragging = true;

      let closestNote = null;
      let minTimeDiff = Infinity;

      this.notes.forEach(note => {
        if (note.judged || note.active) return;
        if (note.type !== 'tap' && note.type !== 'hold') return;

        const timingError = Math.abs(note.time - this.songTime);
        if (timingError <= TIMING_WINDOWS.good) {
          if (timingError < minTimeDiff) {
            minTimeDiff = timingError;
            closestNote = note;
          }
        }
      });

      const hittableNote = closestNote;
      if (hittableNote) {
        if (hittableNote.type === 'tap') {
          hittableNote.judged = true;
        } else if (hittableNote.type === 'hold') {
          hittableNote.active = true;
          this.activeHolds[event.pointerId] = hittableNote;
        }

        this.triggerLineFlash();
        this.playHitSound();
        const timingError = Math.abs(hittableNote.time - this.songTime);

        if (timingError <= TIMING_WINDOWS.perfect) {
          this.score += 100;
          this.combo++;
          this.spawnHitEffect(hittableNote, 'perfect');
        } else {
          this.score += 50;
          this.combo++;
          this.spawnHitEffect(hittableNote, 'good');
        }
      }
    },
    handleInteractionEnd(event) {
      this.isDragging = false;
      const activeHold = this.activeHolds[event.pointerId];
      if (activeHold) {
        activeHold.active = false;
        activeHold.judged = true;
        this.combo = 0;
        delete this.activeHolds[event.pointerId];
      }
    },
    handleInteractionMove(event) {
      if (!this.isPlaying || !this.isDragging) return;

      this.notes.forEach(note => {
        if ((note.type === 'swipe' || note.type === 'catch') && !note.judged) {
          const timingError = Math.abs(note.time - this.songTime);
          if (timingError <= TIMING_WINDOWS.good) {
            note.judged = true;
            this.triggerLineFlash();
            this.playHitSound();
            if (timingError <= TIMING_WINDOWS.perfect) {
              this.score += 100;
              this.combo++;
              this.spawnHitEffect(note, 'perfect');
            } else {
              this.score += 50;
              this.combo++;
              this.spawnHitEffect(note, 'good');
            }
          }
        }
      });
    },
    playHitSound() {
      if (this.$refs.hitSfxPlayer) {
        this.$refs.hitSfxPlayer.currentTime = 0;
        this.$refs.hitSfxPlayer.play();
      }
    },
    triggerLineFlash() {
      this.lineFlashing = true;
      setTimeout(() => { this.lineFlashing = false; }, 200);
    },
    spawnHitEffect(note, judgment) {
      const newEffect = {
        id: effectIdCounter++,
        x: note.x,
        y: this.judgmentLinePosition,
        judgment: judgment
      };
      this.activeEffects.push(newEffect);
      setTimeout(() => {
        this.activeEffects = this.activeEffects.filter(e => e.id !== newEffect.id);
      }, 500);
    },
    lerp(start, end, progress) {
      return start + (end - start) * progress;
    },
    updateJudgmentLine() {
      const { events } = this.chart;
      if (!events || events.length === 0) return;

      let currentEvent = events[0];
      for (let i = events.length - 1; i >= 0; i--) {
        if (this.songTime >= events[i].time) {
          currentEvent = events[i];
          break;
        }
      }

      let nextEvent = null;
      for (let i = 0; i < events.length; i++) {
        if (events[i].time > this.songTime) {
          nextEvent = events[i];
          break;
        }
      }

      if (nextEvent) {
        const progress = (this.songTime - currentEvent.time) / (nextEvent.time - currentEvent.time);
        this.judgmentLinePosition = this.lerp(currentEvent.y, nextEvent.y, progress);
        this.judgmentLineRotation = this.lerp(currentEvent.rotation, nextEvent.rotation, progress);
      } else {
        this.judgmentLinePosition = currentEvent.y;
        this.judgmentLineRotation = currentEvent.rotation;
      }
    },
    gameLoop() {
      if (!this.isPlaying) return;

      this.songTime = this.$refs.audioPlayer.currentTime * 1000;

      // Update active holds
      for (const pointerId in this.activeHolds) {
        const note = this.activeHolds[pointerId];
        const holdEndTime = note.time + note.duration;

        if (this.songTime >= holdEndTime) {
          // Hold completed successfully
          note.active = false;
          note.judged = true;
          this.score += 200; // Bonus for completing the hold
          this.combo++;
          this.spawnHitEffect(note, 'perfect');
          delete this.activeHolds[pointerId];
        } else {
          // Update visual progress
          const progress = (this.songTime - note.time) / note.duration;
          note.holdProgress = Math.max(0, Math.min(1, progress));
        }
      }

      // Check for missed notes
      this.notes.forEach(note => {
        if (!note.judged && !note.active && (this.songTime > note.time + TIMING_WINDOWS.miss)) {
          note.judged = true; // Mark as judged to remove it
          this.combo = 0; // Reset combo on miss
        }
      });

      this.updateJudgmentLine();

      // Calculate note positions
      this.notes.forEach(note => {
        const timeUntilHit = note.time - this.songTime;
        const progress = 1 - (timeUntilHit / this.lookaheadTime);
        note.y = this.lerp(0, this.judgmentLinePosition, progress);
        if (note.type === 'hold' && note.active) {
          const endTimeUntilHit = (note.time + note.duration) - this.songTime;
          const endProgress = 1 - (endTimeUntilHit / this.lookaheadTime);
          const endY = this.lerp(0, this.judgmentLinePosition, endProgress);
          note.endY = endY;
        }
      });

      if (this.songTime >= this.songDuration && this.songDuration > 0) {
        this.isPlaying = false;
      } else {
        requestAnimationFrame(this.gameLoop);
      }
    }
  },
  created() {
    this.loadChart();
  }
};
</script>

<style scoped>
/* Unchanged */
</style>
