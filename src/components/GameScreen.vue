<template>
  <div
    class="game-screen"
    @pointerdown="handleInteractionStart"
    @pointerup="handleInteractionEnd"
    @pointerleave="handleInteractionEnd"
    @pointermove="handleInteractionMove"
  >
    <div class="grid-background" :style="backgroundStyle"></div>
    <progress-bar :song-time="songTime" :song-duration="songDuration" v-if="isPlaying" />
    <HUD :score="score" :combo="combo" v-if="isPlaying" @pause="togglePause" />

    <div v-if="isPaused" class="pause-overlay">
      <div class="pause-menu" v-if="!showSettings">
        <h2>Paused</h2>
        <button @click.stop="togglePause">Resume</button>
        <button @click.stop="showSettings = true">Settings</button>
        <button @click.stop="confirmExit">Exit to Menu</button>
      </div>
      <settings-menu
        v-if="showSettings"
        :settings="settings"
        @close="showSettings = false"
        @settingsChange="handleSettingsChange"
      />
    </div>

    <div v-if="!isPlaying && !chartLoaded" class="play-button-container">
      <p>Loading Chart...</p>
    </div>
     <div v-if="!isPlaying && chartLoaded" class="play-button-container">
      <button @click.stop="startGame">Play</button>
    </div>

    <div class="notes-container">
      <geometric-note
        v-for="note in visibleNotes"
        :key="note.id"
        :note="note"
        :lookahead-time="lookaheadTime"
        :viewport-height="viewportHeight"
        :hold-progress="note.holdProgress"
        :note-size="settings.noteSize"
        :style="{ top: note.y + '%', left: note.x + '%', opacity: note.opacity }"
      />
    </div>
    <hit-effect
      v-for="effect in activeEffects"
      :key="effect.id"
      :x="effect.x"
      :y="effect.y"
      :judgment="effect.judgment"
    />
    <judgment-line
      :y="judgmentLinePosition"
      :rotation="judgmentLineRotation"
      :flash="lineFlashing"
      :show-shockwave="triggerShockwave"
    />
    <audio ref="audioPlayer" @loadedmetadata="onSongLoaded"></audio>
    <audio ref="perfectHitSfxPlayer" src="/audio/perfect_hit.mp3"></audio>
    <audio ref="goodHitSfxPlayer" src="/audio/good_hit.mp3"></audio>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';
import JudgmentLine from './JudgmentLine.vue';
import HitEffect from './HitEffect.vue';
import HUD from './HUD.vue';
import ProgressBar from './ProgressBar.vue';
import SettingsMenu from './SettingsMenu.vue';

const TIMING_WINDOWS = { perfect: 50, good: 100, miss: 200 };
let effectIdCounter = 0;

export default {
  name: 'GameScreen',
  components: { GeometricNote, JudgmentLine, HitEffect, HUD, ProgressBar, SettingsMenu },
  props: {
    chartUrl: { type: String, required: true },
    chartData: { type: Object, default: null },
    settings: { type: Object, required: true },
  },
  emits: ['exit', 'songFinished', 'settingsChange', 'chartLoaded'],
  data() {
    return {
      chart: null,
      notes: [],
      activeEffects: [],
      activeHolds: {},
      isDragging: false,
      isPaused: false,
      showSettings: false,
      judgmentLinePosition: 85,
      judgmentLineRotation: 0,
      isPlaying: false,
      chartLoaded: false,
      songTime: 0,
      songDuration: 0,
      isAudioReady: false,
      gameStartTime: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      lineFlashing: false,
      triggerShockwave: false,
      viewportHeight: 0,
    };
  },
  mounted() {
    this.viewportHeight = window.innerHeight;
    this.loadChart();
    this.applyVolume(this.settings.volume);

    // Add error listeners for robust audio handling
    this.$refs.audioPlayer.addEventListener('error', this.handleAudioError);
    this.$refs.perfectHitSfxPlayer.addEventListener('error', this.handleAudioError);
    this.$refs.goodHitSfxPlayer.addEventListener('error', this.handleAudioError);
  },
  beforeUnmount() {
    this.$refs.audioPlayer.removeEventListener('error', this.handleAudioError);
    this.$refs.perfectHitSfxPlayer.removeEventListener('error', this.handleAudioError);
    this.$refs.goodHitSfxPlayer.removeEventListener('error', this.handleAudioError);
  },
  computed: {
    backgroundStyle() {
      return {
        opacity: this.settings.backgroundBrightness / 100,
      };
    },
    lookaheadTime() {
      return 4000 / this.settings.noteSpeed;
    },
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
      this.chartLoaded = false;
      try {
        let chartJson;
        if (this.chartData) {
          chartJson = this.chartData;
        } else {
          if (!this.chartUrl) return;
          const response = await fetch(this.chartUrl);
          chartJson = await response.json();
        }

        this.chart = chartJson;

        // Ensure backward compatibility for events
        if (this.chart.events && this.chart.events.length > 0) {
          this.chart.events.forEach(event => {
            if (!event.transitionType) {
              event.transitionType = 'linear';
            }
          });
          this.judgmentLinePosition = this.chart.events[0].y;
          this.judgmentLineRotation = this.chart.events[0].rotation;
        }

        this.notes = this.chart.notes.map(note => ({ ...note, judged: false, active: false, holdProgress: 0 }));
        this.$refs.audioPlayer.src = this.chart.audioUrl;

        // Decouple chart loading from audio loading
        this.chartLoaded = true;
        this.$emit('chartLoaded', { url: this.chartUrl, data: chartJson });

      } catch (error) {
        console.error("Failed to load chart JSON:", error);
        // Even if the chart fails to load, we might want to stop showing "Loading..."
        this.chartLoaded = true;
      }
    },
    onSongLoaded() {
      if (this.$refs.audioPlayer) {
        this.songDuration = this.$refs.audioPlayer.duration * 1000;
        this.isAudioReady = true;
      }
    },
    startGame() {
      if (!this.chartLoaded) return;
      this.isPlaying = true;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.activeHolds = {};
      this.isPaused = false;
      this.showSettings = false;
      this.notes.forEach(note => {
        note.judged = false;
        note.active = false;
        note.holdProgress = 0;
      });

      this.gameStartTime = performance.now();

      if (this.isAudioReady) {
        this.$refs.audioPlayer.currentTime = 0;
        this.$refs.audioPlayer.play().catch(error => {
          console.warn(`[Audio Playback Error] Could not play main audio track, continuing in silence. Error: ${error.message}`);
        });
      }

      requestAnimationFrame(this.gameLoop);
    },
    handleInteractionStart(event) {
      if (!this.isPlaying || this.isPaused) return;
      this.isDragging = true;

      // Find all hittable notes within the timing window
      const hittableNotes = this.notes.filter(note => {
        if (note.judged || note.active) return false;
        if (note.type !== 'tap' && note.type !== 'hold') return false;
        const timingError = Math.abs(note.time - this.songTime);
        return timingError <= TIMING_WINDOWS.good;
      });

      // If there are hittable notes, sort them by their scheduled time
      // and pick the one that was supposed to be hit first.
      if (hittableNotes.length > 0) {
        hittableNotes.sort((a, b) => a.time - b.time);
        const targetNote = hittableNotes[0];

        if (targetNote.type === 'tap') {
          targetNote.judged = true;
        } else if (targetNote.type === 'hold') {
          targetNote.active = true;
          this.activeHolds[event.pointerId] = targetNote;
        }

        this.triggerLineFlash();
        const timingError = Math.abs(targetNote.time - this.songTime);

        if (timingError <= TIMING_WINDOWS.perfect) {
          this.playHitSound('perfect');
          this.triggerShockwaveEffect();
          this.score += 100;
          this.combo++;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
          this.spawnHitEffect(targetNote, 'perfect');
        } else {
          this.playHitSound('good');
          this.score += 50;
          this.combo++;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
          this.spawnHitEffect(targetNote, 'good');
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
      if (!this.isPlaying || this.isPaused || !this.isDragging) return;
      this.notes.forEach(note => {
        if ((note.type === 'swipe' || note.type === 'catch') && !note.judged) {
          const timingError = Math.abs(note.time - this.songTime);
          if (timingError <= TIMING_WINDOWS.good) {
            note.judged = true;
            this.triggerLineFlash();
            if (timingError <= TIMING_WINDOWS.perfect) {
              this.playHitSound('perfect');
              this.triggerShockwaveEffect();
              this.score += 100;
              this.combo++;
              this.maxCombo = Math.max(this.maxCombo, this.combo);
              this.spawnHitEffect(note, 'perfect');
            } else {
              this.playHitSound('good');
              this.score += 50;
              this.combo++;
              this.maxCombo = Math.max(this.maxCombo, this.combo);
              this.spawnHitEffect(note, 'good');
            }
          }
        }
      });
    },
    togglePause() {
      if (!this.isPlaying) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.$refs.audioPlayer.pause();
      } else {
        this.showSettings = false;
        this.$refs.audioPlayer.play();
        requestAnimationFrame(this.gameLoop);
      }
    },
    handleSettingsChange(newSettings) {
      this.$emit('settingsChange', newSettings);
    },
    confirmExit() {
      if (window.confirm('Are you sure you want to exit? All progress will be lost.')) {
        this.$emit('exit');
      }
    },
    applyVolume(volume) {
      const newVolume = volume / 100;
      if (this.$refs.audioPlayer) {
        this.$refs.audioPlayer.volume = newVolume;
      }
      if (this.$refs.perfectHitSfxPlayer) {
        this.$refs.perfectHitSfxPlayer.volume = newVolume;
      }
      if (this.$refs.goodHitSfxPlayer) {
        this.$refs.goodHitSfxPlayer.volume = newVolume;
      }
    },
    handleAudioError(event) {
      console.warn(`[Audio Error] Failed to load audio source: ${event.target.src}. Gameplay will continue without this audio.`);
      // We could set a flag here, e.g., event.target.failedToLoad = true, if needed.
    },
    playHitSound(judgment) {
      const player = judgment === 'perfect' ? this.$refs.perfectHitSfxPlayer : this.$refs.goodHitSfxPlayer;
      // Play sound only if it has loaded some data and hasn't failed
      if (player && player.readyState > 0 && !player.error) {
        player.currentTime = 0;
        // The play() method itself returns a Promise which can be used for further error handling
        player.play().catch(error => {
          console.warn(`[Audio Playback Error] Could not play hit sound: ${error.message}`);
        });
      }
    },
    triggerLineFlash() {
      this.lineFlashing = true;
      setTimeout(() => { this.lineFlashing = false; }, 200);
    },
    triggerShockwaveEffect() {
      this.triggerShockwave = true;
      setTimeout(() => { this.triggerShockwave = false; }, 500); // Duration should match animation
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
      }, 1000);
    },
    lerp(start, end, progress) {
      return start + (end - start) * progress;
    },
    easeIn(t) {
      return t * t;
    },
    easeOut(t) {
      return t * (2 - t);
    },
    easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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
        if (nextEvent.transitionType === 'jump') {
          this.judgmentLinePosition = nextEvent.y;
          this.judgmentLineRotation = nextEvent.rotation;
          return; // Skip interpolation for jumps
        }

        let progress = (this.songTime - currentEvent.time) / (nextEvent.time - currentEvent.time);

        // Apply easing based on the transition type of the *next* event
        switch (nextEvent.transitionType) {
          case 'easeIn':
            progress = this.easeIn(progress);
            break;
          case 'easeOut':
            progress = this.easeOut(progress);
            break;
          case 'easeInOut':
            progress = this.easeInOut(progress);
            break;
          // 'linear' is the default, no change needed
        }

        this.judgmentLinePosition = this.lerp(currentEvent.y, nextEvent.y, progress);
        this.judgmentLineRotation = this.lerp(currentEvent.rotation, nextEvent.rotation, progress);
      } else {
        this.judgmentLinePosition = currentEvent.y;
        this.judgmentLineRotation = currentEvent.rotation;
      }
    },
    gameLoop() {
      if (!this.isPlaying || this.isPaused) return;

      if (this.isAudioReady) {
        // Primary, more accurate clock source
        this.songTime = this.$refs.audioPlayer.currentTime * 1000 + this.settings.audioOffset;
      } else {
        // Fallback clock source if audio failed to load
        this.songTime = (performance.now() - this.gameStartTime) + this.settings.audioOffset;
      }

      for (const pointerId in this.activeHolds) {
        const note = this.activeHolds[pointerId];
        const holdEndTime = note.time + note.duration;
        if (this.songTime >= holdEndTime) {
          note.active = false;
          note.judged = true;
          this.score += 200;
          this.combo++;
          this.maxCombo = Math.max(this.maxCombo, this.combo);
          this.playHitSound('perfect');
          this.triggerShockwaveEffect();
          this.spawnHitEffect(note, 'perfect');
          delete this.activeHolds[pointerId];
        } else {
          const progress = (this.songTime - note.time) / note.duration;
          note.holdProgress = Math.max(0, Math.min(1, progress));
        }
      }
      this.notes.forEach(note => {
        if (!note.judged && !note.active && (this.songTime > note.time + TIMING_WINDOWS.miss)) {
          note.judged = true;
          this.combo = 0;
        }
      });
      this.updateJudgmentLine();

      const FADE_IN_DURATION = 200; // ms

      this.notes.forEach(note => {
        const timeUntilHit = note.time - this.songTime;
        const progress = 1 - (timeUntilHit / this.lookaheadTime);
        note.y = this.lerp(0, this.judgmentLinePosition, progress);

        // Calculate fade-in opacity
        const noteAge = this.songTime - (note.time - this.lookaheadTime);
        note.opacity = Math.min(1, noteAge / FADE_IN_DURATION);

        if (note.type === 'hold' && note.active) {
          const endTimeUntilHit = (note.time + note.duration) - this.songTime;
          const endProgress = 1 - (endTimeUntilHit / this.lookaheadTime);
          note.endY = this.lerp(0, this.judgmentLinePosition, endProgress);
        }
      });
      if (this.songTime >= this.songDuration && this.songDuration > 0) {
        this.isPlaying = false;
        this.$emit('songFinished', { score: this.score, maxCombo: this.maxCombo });
      } else {
        requestAnimationFrame(this.gameLoop);
      }
    }
  },
  watch: {
    'settings.volume'(newVolume) {
      this.applyVolume(newVolume);
    }
  }
};
</script>

<style scoped>
/* Styles are complete and correct */
.game-screen {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.grid-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(128, 0, 128, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(128, 0, 128, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: bg-scroll 10s linear infinite;
  transition: opacity 0.3s; /* Smooth transition for brightness change */
}

@keyframes bg-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

.play-button-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 10;
  color: #fff;
}
.play-button-container button {
  padding: 15px 30px;
  font-size: 24px;
  background: rgba(0,0,0,0.4);
  color: white;
  border: 2px solid white;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff;
  transition: all 0.2s;
}
.play-button-container button:hover {
  box-shadow: 0 0 25px #fff, 0 0 45px #00ffff;
}

.notes-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  color: white;
}

.pause-menu {
  text-align: center;
  padding: 40px;
  background: rgba(20, 20, 20, 0.9);
  border: 2px solid #fff;
  border-radius: 10px;
  box-shadow: 0 0 20px #fff, 0 0 40px #ff00ff;
}

.pause-menu button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 18px;
  background: rgba(0,0,0,0.4);
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 0 10px #fff;
  transition: box-shadow 0.2s, background-color 0.2s;
}

.pause-menu button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff;
}
</style>
