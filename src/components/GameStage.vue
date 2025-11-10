<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>

    <div v-if="gameState === 'startScreen'" class="start-overlay" @click="startGame">
      <h1>Click to Start</h1>
    </div>

    <div v-if="gameState === 'results'" class="results-overlay">
      <div class="results-box">
        <h1>Results</h1>
        <h2>Score: {{ scoreManager?.getScore() }}</h2>
        <h3>Max Combo: {{ scoreManager?.maxCombo }}</h3>
        <button @click="restartGame" class="restart-button">Restart</button>
      </div>
    </div>

    <audio ref="audioElement" src="/song.mp3" style="display: none;"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { JudgementLine } from '../core/JudgementLine.js';
import { JudgementLineManager } from '../core/JudgementLineManager.js';
import { NoteManager } from '../core/NoteManager.js';
import { testChart } from '../core/Chart.js';
import { EffectManager } from '../core/EffectManager.js';
import { ScoreManager } from '../core/ScoreManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { DynamicBackground } from '../core/DynamicBackground.js';

const gameCanvas = ref(null);
const audioElement = ref(null);

const gameState = ref('startScreen'); // 'startScreen', 'playing', 'results'
let ctx = null;
let judgementLine = null;
let judgementLineManager = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

const resetGameModules = () => {
  judgementLine = new JudgementLine(gameCanvas.value);
  judgementLineManager = new JudgementLineManager(judgementLine, testChart.judgementLineEvents, gameCanvas.value);
  scoreManager = new ScoreManager();
  noteManager = new NoteManager(gameCanvas.value, testChart, scoreManager, judgementLine);
  effectManager = new EffectManager();
  audioManager = new AudioManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);
};

const initializeGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth;
    gameCanvas.value.height = window.innerHeight;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  resetGameModules();

  gameCanvas.value.addEventListener('mousedown', handleInputStart);
  gameCanvas.value.addEventListener('touchstart', handleInputStart);
  gameCanvas.value.addEventListener('mouseup', handleInputEnd);
  gameCanvas.value.addEventListener('touchend', handleInputEnd);

  console.log('Game initialized.');
};

const startGame = () => {
  if (audioElement.value) {
    audioElement.value.play().then(() => {
      gameState.value = 'playing';
      gameLoop();
    }).catch(error => {
      console.error("Audio playback failed:", error);
    });
  }
};

onMounted(initializeGame);

const handleInputStart = (event) => {
  event.preventDefault();
  if (gameState.value !== 'playing') return;

  const tapNote = noteManager.checkTapHit();
  if (tapNote) {
    scoreManager.onHit();
    effectManager.createExplosion(tapNote.x, tapNote.y, '#FF0000');
    audioManager.playHitSound();
    judgementLine.flash();
    return;
  }

  const holdNote = noteManager.checkHoldStart();
  if (holdNote) {
    audioManager.playHitSound();
    judgementLine.flash();
  } else {
    scoreManager.onMiss();
  }
};

const handleInputEnd = (event) => {
  event.preventDefault();
  if (gameState.value !== 'playing') return;
  noteManager.checkHoldEnd();
};

const restartGame = () => {
  audioElement.value.pause();
  audioElement.value.currentTime = 0;
  resetGameModules();
  gameState.value = 'startScreen';
};

const update = () => {
  if (gameState.value !== 'playing' || !audioElement.value) return;
  const gameTime = audioElement.value.currentTime * 1000;

  judgementLine.update();
  if (judgementLineManager) judgementLineManager.update(gameTime);
  noteManager.update(gameTime);
  effectManager.update();
  dynamicBackground.update();

  // New, more robust song end condition
  const audio = audioElement.value;
  if (audio && audio.duration > 0 && (audio.duration - audio.currentTime) < 0.1) {
    if (noteManager.notes.length === 0 && noteManager.activeHolds.size === 0) {
      console.log("--- SONG ENDED, SWITCHING TO RESULTS ---");
      gameState.value = 'results';
    }
  }
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

  dynamicBackground.draw(ctx);

  if (audioElement.value && audioElement.value.duration) {
    const progress = audioElement.value.currentTime / audioElement.value.duration;
    const progressBarWidth = progress * gameCanvas.value.width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, progressBarWidth, 5);
  }

  judgementLine.draw();
  noteManager.draw();
  effectManager.draw(ctx);

  if (scoreManager) {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${scoreManager.getScore()}`, gameCanvas.value.width - 20, 40);

    if (scoreManager.getCombo() > 1) {
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${scoreManager.getCombo()}`, gameCanvas.value.width / 2, gameCanvas.value.height / 2);
    }
  }
};

const gameLoop = () => {
  if (gameState.value !== 'playing') return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
.game-container { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.game-canvas { display: block; background-color: #121212; }

.start-overlay, .results-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-family: 'Arial', sans-serif;
}
.start-overlay {
  cursor: pointer;
  font-size: 2em;
}

.results-box {
  border: 2px solid white;
  padding: 2em 4em;
  background-color: rgba(20, 20, 20, 0.5);
}
.results-box h1 {
  margin-bottom: 1em;
  font-size: 3em;
}
.results-box h2, .results-box h3 {
  margin: 0.5em 0;
}

.restart-button {
  margin-top: 2em;
  padding: 0.8em 2em;
  background-color: transparent;
  border: 2px solid white;
  color: white;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}
.restart-button:hover {
  background-color: white;
  color: black;
}
</style>
