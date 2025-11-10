<template>
  <div class="game-screen" @mousedown="handleInteraction">
    <div class="ui-container">
      <div class="score">Score: {{ score }}</div>
      <div class="combo">Combo: {{ combo }}</div>
    </div>
    <FallingNote v-for="note in notes" :key="note.id" :note-data="note" />
    <div class="judgment-line" ref="judgmentLine" :class="judgmentLineClass"></div>
  </div>
</template>

<script>
import FallingNote from './FallingNote.vue';

const NOTE_SPEED = 200; // Pixels per second
const PERFECT_WINDOW = 50; // Distance in pixels
const GOOD_WINDOW = 100; // Distance in pixels

export default {
  name: 'GameScreen',
  components: {
    FallingNote
  },
  data() {
    return {
      notes: [],
      gameLoopId: null,
      lastFrameTime: null,
      judgmentLineY: 0,
      judgmentLineClass: '',
      score: 0,
      combo: 0
    };
  },
  mounted() {
    this.judgmentLineY = this.$refs.judgmentLine.getBoundingClientRect().top;

    // Initialize sample notes with a starting y-position
    this.notes = [
      { id: 1, x: 20, y: 0 },
      { id: 2, x: 40, y: 0 },
      { id: 3, x: 60, y: -200 }, // Start this one further up
      { id: 4, x: 80, y: -400 }
    ];

    this.startGameLoop();
  },
  beforeUnmount() {
    this.stopGameLoop();
  },
  methods: {
    handleInteraction() {
      let judged = false;

      // Find the note closest to the judgment line
      let closestNote = null;
      let minDistance = Infinity;

      this.notes.forEach(note => {
        const distance = Math.abs(note.y - this.judgmentLineY);
        if (distance < minDistance) {
          minDistance = distance;
          closestNote = note;
        }
      });

      if (closestNote) {
        if (minDistance <= PERFECT_WINDOW) {
          console.log(`Note ${closestNote.id}: Perfect!`);
          this.score += 100;
          this.combo++;
          this.triggerJudgmentFeedback();
          this.notes = this.notes.filter(n => n.id !== closestNote.id);
          judged = true;
        } else if (minDistance <= GOOD_WINDOW) {
          console.log(`Note ${closestNote.id}: Good!`);
          this.score += 50;
          this.combo++;
          this.triggerJudgmentFeedback();
          this.notes = this.notes.filter(n => n.id !== closestNote.id);
          judged = true;
        }
      }

      if (!judged) {
        console.log('Miss!');
        this.combo = 0;
      }
    },
    triggerJudgmentFeedback() {
      this.judgmentLineClass = 'judgment-line-hit';
      setTimeout(() => {
        this.judgmentLineClass = '';
      }, 100);
    },
    startGameLoop() {
      this.lastFrameTime = performance.now();
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    },
    stopGameLoop() {
      cancelAnimationFrame(this.gameLoopId);
    },
    gameLoop(currentTime) {
      const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Time in seconds
      this.lastFrameTime = currentTime;

      // Update note positions
      this.notes.forEach(note => {
        note.y += NOTE_SPEED * deltaTime;
      });

      // Handle missed notes and remove notes that have gone off-screen
      const missedNotes = this.notes.filter(note => note.y > this.judgmentLineY + GOOD_WINDOW);
      if (missedNotes.length > 0) {
        missedNotes.forEach(note => {
          console.log(`Note ${note.id}: Missed!`);
          this.combo = 0;
        });
        this.notes = this.notes.filter(note => !missedNotes.includes(note));
      }

      this.notes = this.notes.filter(note => note.y < window.innerHeight + 100); // Remove notes well off-screen

      // Request the next frame
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
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 3px;
  background-color: #00FFFF;
  box-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF;
  transition: background-color 0.1s ease, box-shadow 0.1s ease;
}

.judgment-line-hit {
  background-color: #FFFFFF;
  box-shadow: 0 0 15px #FFFFFF, 0 0 30px #FFFFFF;
}
</style>
