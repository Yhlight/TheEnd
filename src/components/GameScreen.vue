<template>
  <div class="game-screen" @click="handleTap">
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
        :note-type="note.type"
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
    playHitSound() {
      if (this.$refs.hitSfxPlayer) {
        this.$refs.hitSfxPlayer.currentTime = 0;
        this.$refs.hitSfxPlayer.play();
      }
    },
    triggerLineFlash() {
      this.lineFlashing = true;
      setTimeout(() => {
        this.lineFlashing = false;
      }, 200);
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
      const events = this.chart.events;
      if (!events || events.length === 0) return;
      const currentEventIndex = events.findIndex(e => e.time > this.songTime) - 1;
      if (currentEventIndex < -1) {
        const firstEvent = events[0];
        this.judgmentLinePosition = firstEvent.y;
        this.judgmentLineRotation = firstEvent.rotation;
        return;
      }
      if (currentEventIndex === -2) {
        const lastEvent = events[events.length - 1];
        this.judgmentLinePosition = lastEvent.y;
        this.judgmentLineRotation = lastEvent.rotation;
        return;
      }
      const prevEvent = events[currentEventIndex];
      const nextEvent = events[currentEventIndex + 1];
      const eventDuration = nextEvent.time - prevEvent.time;
      const timeSincePrevEvent = this.songTime - prevEvent.time;
      const progress = Math.max(0, Math.min(1, timeSincePrevEvent / eventDuration));
      this.judgmentLinePosition = this.lerp(prevEvent.y, nextEvent.y, progress);
      this.judgmentLineRotation = this.lerp(prevEvent.rotation, nextEvent.rotation, progress);
    },
    gameLoop() {
      if (!this.isPlaying) return;
      this.songTime = this.$refs.audioPlayer.currentTime * 1000;
      this.updateJudgmentLine();
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
/* No style changes needed here */
</style>
