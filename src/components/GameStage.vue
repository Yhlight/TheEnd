<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <!-- The start overlay is now controlled by the 'title' game state -->
    <audio ref="audioElement" src="/song.mp3" style="display: none;"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { JudgementLine } from '../core/JudgementLine.js';
import { NoteManager } from '../core/NoteManager.js';
import { songLibrary } from '../core/ChartData.js';
import { EffectManager } from '../core/EffectManager.js';
import { ScoreManager } from '../core/ScoreManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { DynamicBackground } from '../core/DynamicBackground.js';
import { Easing } from '../core/Easing.js';

// Refs for DOM elements
const gameCanvas = ref(null);
const audioElement = ref(null);

// Game state management
const gameState = reactive({
  current: 'title', // 'title', 'songSelect', 'playing', 'paused', 'settings', 'results'
});

// UI element definitions (for hit detection)
const uiElements = {
  pauseButton: { x: 10, y: 10, width: 50, height: 50 },
  paused: {
      resumeButton: { x: 0, y: 0, width: 200, height: 50 }, // Positions will be calculated
      retryButton: { x: 0, y: 0, width: 200, height: 50 },
      settingsButton: { x: 0, y: 0, width: 200, height: 50 },
  },
  settings: {
      backButton: { x: 10, y: 10, width: 100, height: 40 },
      noteSpeed: { label: 'Note Speed', x: 0, y: 0, width: 300, height: 20, value: 1, min: 0.5, max: 5 },
      bgmVolume: { label: 'BGM Volume', x: 0, y: 0, width: 300, height: 20, value: 1, min: 0, max: 1 },
      sfxVolume: { label: 'SFX Volume', x: 0, y: 0, width: 300, height: 20, value: 1, min: 0, max: 1 },
      bgBrightness: { label: 'BG Brightness', x: 0, y: 0, width: 300, height: 20, value: 1, min: 0, max: 1 },
      offset: { label: 'Offset (ms)', x: 0, y: 0, width: 300, height: 20, value: 0, min: -100, max: 100 },
  },
  results: {
      backButton: { x: 0, y: 0, width: 300, height: 50 }, // Position calculated dynamically
  }
};

let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

// Song select state
const songSelectState = reactive({
  selectedIndex: 0,
  cards: [],
  targetScrollX: 0,
  currentScrollX: 0,
  isDragging: false,
  dragStartX: 0,
});

const settings = reactive({
    noteSpeed: 1,
    bgmVolume: 1,
    sfxVolume: 1,
    bgBrightness: 1,
    offset: 0, // In milliseconds
});

const CARD_WIDTH = 350;
const CARD_HEIGHT = 200;
const CARD_MARGIN = 40;
const SELECTED_CARD_SCALE = 1.2;

const resultsState = reactive({
    animationPhase: 'start', // 'start', 'scoring', 'judgements', 'grade', 'done'
    timer: 0,
    displayScore: 0,
    judgementAlpha: [0, 0, 0, 0], // For fade-in effect
    gradeAlpha: 0,
});

const initializeGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth;
    gameCanvas.value.height = window.innerHeight;
    calculateCardPositions();
    calculatePausedMenuPositions();
    calculateSettingsMenuPositions();
    calculateResultsPositions();
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  judgementLine = new JudgementLine(gameCanvas.value);
  effectManager = new EffectManager(gameCanvas.value);
  scoreManager = new ScoreManager(effectManager);
  audioManager = new AudioManager(audioElement.value);
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  noteManager = new NoteManager(
    gameCanvas.value,
    null,
    scoreManager,
    judgementLine,
    audioManager,
    effectManager,
    settings
  );

  gameCanvas.value.addEventListener('mousedown', handlePress);
  gameCanvas.value.addEventListener('touchstart', handlePress);
  gameCanvas.value.addEventListener('mouseup', handleRelease);
  gameCanvas.value.addEventListener('touchend', handleRelease);
  gameCanvas.value.addEventListener('mousemove', handleMove);
  gameCanvas.value.addEventListener('touchmove', handleMove);

  console.log('Game initialized.');
  loadSettings();
  gameLoop();
};

onMounted(initializeGame);

const saveSettings = () => {
    localStorage.setItem('theEndSettings', JSON.stringify(settings));
};

const loadSettings = () => {
    const saved = localStorage.getItem('theEndSettings');
    if (saved) {
        Object.assign(settings, JSON.parse(saved));
    }
    applySettings();
};

const applySettings = () => {
    if (noteManager) noteManager.setNoteSpeed(settings.noteSpeed);
    if (audioManager) {
        audioManager.setBgmVolume(settings.bgmVolume);
        audioManager.setSfxVolume(settings.sfxVolume);
    }
    if (dynamicBackground) dynamicBackground.setBrightness(settings.bgBrightness);
};

const retryCurrentSong = () => {
    scoreManager.reset();
    const selectedSong = songLibrary[songSelectState.selectedIndex];
    noteManager.loadChart(selectedSong.chart);
    audioElement.value.currentTime = 0;
    audioElement.value.play();
    gameState.current = 'playing';
};

const calculateCardPositions = () => {
    const totalWidth = songLibrary.length * (CARD_WIDTH + CARD_MARGIN) - CARD_MARGIN;
    const startX = (gameCanvas.value.width - totalWidth) / 2;
    const y = (gameCanvas.value.height - CARD_HEIGHT) / 2;

    songSelectState.cards = songLibrary.map((song, index) => {
        return {
            song,
            x: startX + index * (CARD_WIDTH + CARD_MARGIN),
            y: y,
            width: CARD_WIDTH,
            height: CARD_HEIGHT
        };
    });
};

const calculatePausedMenuPositions = () => {
    const centerX = gameCanvas.value.width / 2;
    const centerY = gameCanvas.value.height / 2;
    const buttonHeight = uiElements.paused.resumeButton.height;
    const buttonMargin = 20;

    uiElements.paused.resumeButton.x = centerX - uiElements.paused.resumeButton.width / 2;
    uiElements.paused.resumeButton.y = centerY - buttonHeight - buttonMargin;
    uiElements.paused.retryButton.x = centerX - uiElements.paused.retryButton.width / 2;
    uiElements.paused.retryButton.y = centerY;
    uiElements.paused.settingsButton.x = centerX - uiElements.paused.settingsButton.width / 2;
    uiElements.paused.settingsButton.y = centerY + buttonHeight + buttonMargin;
};

const calculateSettingsMenuPositions = () => {
    const centerX = gameCanvas.value.width / 2;
    const startY = 150;
    const itemMargin = 80;

    Object.values(uiElements.settings).forEach((item, index) => {
        if (item.label) {
            item.x = centerX - item.width / 2;
            item.y = startY + index * itemMargin;
        }
    });
};

const calculateResultsPositions = () => {
    const centerX = gameCanvas.value.width / 2;
    const bottomY = gameCanvas.value.height - 80;
    uiElements.results.backButton.x = centerX - uiElements.results.backButton.width / 2;
    uiElements.results.backButton.y = bottomY;
};

const NUMBER_MAP = {
  '0':[" XXX ","X   X","X   X","X   X","X   X","X   X"," XXX ",],"1":["  X  "," XX  ","  X  ","  X  ","  X  ","  X  "," XXX ",],"2":[" XXX ","X   X","    X","   X ","  X  "," X   ","XXXXX",],"3":[" XXX ","X   X","    X"," XXX ","    X","X   X"," XXX ",],"4":["X   X","X   X","X   X","XXXXX","    X","    X","    X",],"5":["XXXXX","X    ","X    ","XXXX ","    X","X   X"," XXX ",],"6":[" XXX ","X   X","X    ","XXXX ","X   X","X   X"," XXX ",],"7":["XXXXX","X   X","    X","   X ","  X  ","  X  ","  X  ",],"8":[" XXX ","X   X","X   X"," XXX ","X   X","X   X"," XXX ",],"9":[" XXX ","X   X","X   X"," XXXX","    X","X   X"," XXX ",],
};

const drawStylizedNumber = (ctx, text, x, y, squareSize, color) => {
  const textWidth = text.length * 5 * squareSize + (text.length - 1) * squareSize;
  let currentX = x - textWidth;
  for (const char of text) {
    const matrix = NUMBER_MAP[char];
    if (!matrix) continue;
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 'X') {
          ctx.fillStyle = color;
          ctx.fillRect(currentX + col * squareSize,y + row * squareSize,squareSize,squareSize);
        }
      }
    }
    currentX += 6 * squareSize;
  }
};

const updateTitle = () => {
    dynamicBackground.update();
};

const updateSongSelect = () => {
    dynamicBackground.update();
    const lerpFactor = 0.1;
    songSelectState.currentScrollX += (songSelectState.targetScrollX - songSelectState.currentScrollX) * lerpFactor;
    const centerScreenX = gameCanvas.value.width / 2;
    let closestCardIndex = 0;
    let minDistance = Infinity;

    songSelectState.cards.forEach((card, index) => {
        const cardCenterX = card.x - songSelectState.currentScrollX;
        const distance = Math.abs(centerScreenX - cardCenterX);
        if (distance < minDistance) {
            minDistance = distance;
            closestCardIndex = index;
        }
    });
    songSelectState.selectedIndex = closestCardIndex;

    if (!songSelectState.isDragging) {
        const selectedCard = songSelectState.cards[songSelectState.selectedIndex];
        if (selectedCard) {
            const targetX = selectedCard.x - centerScreenX;
            songSelectState.targetScrollX = targetX;
        }
    }
};

let gameStartTime = null;
const updatePlaying = () => {
  let gameTime = audioElement.value.currentTime * 1000;
  if (audioElement.value.paused && gameTime === 0) {
    if (gameStartTime === null) { gameStartTime = performance.now(); }
    gameTime = performance.now() - gameStartTime;
  }
  judgementLine.update(gameTime);
  noteManager.update(gameTime);
  effectManager.update();
  dynamicBackground.update();

  if (audioElement.value && audioElement.value.ended) {
    Object.assign(resultsState, {
        animationPhase: 'scoring',
        timer: 0,
        displayScore: 0,
        judgementAlpha: [0, 0, 0, 0],
        gradeAlpha: 0,
    });
    gameState.current = 'results';
  }
};

const updateResults = () => {
    resultsState.timer += 1/60;
    const finalScore = scoreManager.getScore();
    const scoreRollDuration = 2;

    if (resultsState.animationPhase === 'scoring') {
        if (resultsState.timer < scoreRollDuration) {
            resultsState.displayScore = Math.floor(Easing.easeOutCubic(resultsState.timer / scoreRollDuration) * finalScore);
        } else {
            resultsState.displayScore = finalScore;
            resultsState.animationPhase = 'judgements';
            resultsState.timer = 0;
        }
    } else if (resultsState.animationPhase === 'judgements') {
        const judgementFadeInDuration = 0.5;
        const index = Math.floor(resultsState.timer / judgementFadeInDuration);
        if (index < 4) {
            resultsState.judgementAlpha[index] = Math.min(1, resultsState.judgementAlpha[index] + 0.1);
        } else {
            resultsState.animationPhase = 'grade';
            resultsState.timer = 0;
        }
    } else if (resultsState.animationPhase === 'grade') {
        const gradeFadeInDuration = 1;
        if (resultsState.timer < gradeFadeInDuration) {
            resultsState.gradeAlpha = Easing.easeInQuad(resultsState.timer / gradeFadeInDuration);
        } else {
            resultsState.gradeAlpha = 1;
            resultsState.animationPhase = 'done';
        }
    }
};

const drawTitle = () => {
    dynamicBackground.draw(ctx);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TheEnd', gameCanvas.value.width / 2, gameCanvas.value.height / 2 - 50);
    ctx.font = '24px sans-serif';
    ctx.fillText('Click to Start', gameCanvas.value.width / 2, gameCanvas.value.height / 2 + 20);
};

const drawSongSelect = () => {
    dynamicBackground.draw(ctx);
    songSelectState.cards.forEach((card, index) => {
        const cardRenderX = card.x - songSelectState.currentScrollX - card.width / 2;
        let scale = 1.0;
        if (index === songSelectState.selectedIndex) {
            scale = SELECTED_CARD_SCALE;
        }
        const scaledWidth = card.width * scale;
        const scaledHeight = card.height * scale;
        const renderX = cardRenderX + (card.width - scaledWidth) / 2;
        const renderY = card.y + (card.height - scaledHeight) / 2;

        ctx.save();
        ctx.translate(renderX + scaledWidth / 2, renderY + scaledHeight / 2);
        ctx.translate(-(renderX + scaledWidth / 2), -(renderY + scaledHeight / 2));

        if (index === songSelectState.selectedIndex) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'cyan';
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
        }

        ctx.fillRect(renderX, renderY, scaledWidth, scaledHeight);
        ctx.strokeRect(renderX, renderY, scaledWidth, scaledHeight);

        ctx.fillStyle = 'white';
        ctx.font = `${32 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(card.song.title, renderX + scaledWidth / 2, renderY + scaledHeight / 2);
        ctx.font = `${20 * scale}px sans-serif`;
        ctx.fillText(card.song.artist, renderX + scaledWidth / 2, renderY + scaledHeight / 2 + 30 * scale);

        ctx.restore();
    });
};

const drawHudBackground = (ctx) => {
    // Background for the score
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(gameCanvas.value.width - 220, 10, 210, 50);

    // Background for the combo
    if (scoreManager.getCombo() > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        const comboText = scoreManager.getCombo().toString();
        const textWidth = comboText.length * 5 * 8 + (comboText.length - 1) * 8 + 40;
        const x = (gameCanvas.value.width / 2) - (textWidth / 2);
        ctx.fillRect(x, gameCanvas.value.height * 0.4 - 20, textWidth, 80);
    }
};

const drawPlaying = () => {
  dynamicBackground.draw(ctx);
  const pb = uiElements.pauseButton;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(pb.x, pb.y, pb.width, pb.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(pb.x + 15, pb.y + 10, 8, 30);
  ctx.fillRect(pb.x + 30, pb.y + 10, 8, 30);

  if (audioElement.value && audioElement.value.duration) {
    const progress = audioElement.value.currentTime / audioElement.value.duration;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.fillRect(0, 0, progress * gameCanvas.value.width, 5);
  }

  judgementLine.draw();
  noteManager.draw(ctx, judgementLine.x);
  effectManager.draw(ctx);

  drawHudBackground(ctx);
  drawStylizedNumber(ctx, scoreManager.getScore().toString(), gameCanvas.value.width - 20, 20, 4, 'white');
  if (scoreManager.getCombo() > 1) {
      const comboText = scoreManager.getCombo().toString();
      const textWidth = comboText.length * 5 * 8 + (comboText.length - 1) * 8;
      const x = (gameCanvas.value.width / 2) + (textWidth / 2);
      drawStylizedNumber(ctx, comboText, x, gameCanvas.value.height * 0.4, 8, 'white');
  }
};

const drawPaused = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
    const buttons = uiElements.paused;
    Object.entries(buttons).forEach(([key, btn]) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
        ctx.fillStyle = 'black';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = key.replace('Button', '').toUpperCase();
        ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    });
};

const drawSettings = () => {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
    const backBtn = uiElements.settings.backButton;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Back', backBtn.x + backBtn.width / 2, backBtn.y + backBtn.height / 2);

    Object.entries(uiElements.settings).forEach(([key, slider]) => {
        if (!slider.label) return;
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(slider.label, slider.x, slider.y - 15);
        ctx.fillStyle = '#555';
        ctx.fillRect(slider.x, slider.y, slider.width, slider.height);
        const valueRatio = (settings[key] - slider.min) / (slider.max - slider.min);
        const handleX = slider.x + valueRatio * slider.width;
        ctx.fillStyle = 'cyan';
        ctx.fillRect(handleX - 10, slider.y - 5, 20, slider.height + 10);
        ctx.textAlign = 'right';
        ctx.fillText(settings[key].toFixed(1), slider.x + slider.width, slider.y - 15);
    });
};

const drawResults = () => {
    dynamicBackground.draw(ctx);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
    const centerX = gameCanvas.value.width / 2;
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Results', centerX, 80);

    drawStylizedNumber(ctx, resultsState.displayScore.toString(), centerX + 150, 150, 6, 'white');
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Score', centerX - 20, 180);
    drawStylizedNumber(ctx, scoreManager.getMaxCombo().toString(), centerX + 150, 220, 4, 'white');
    ctx.textAlign = 'right';
    ctx.fillText('Max Combo', centerX - 20, 240);

    const judgements = scoreManager.getJudgementCounts();
    const judgementYStart = 300;
    Object.entries(judgements).forEach(([key, value], index) => {
        ctx.save();
        ctx.globalAlpha = resultsState.judgementAlpha[index];
        ctx.textAlign = 'left';
        ctx.fillText(key, centerX - 150, judgementYStart + index * 40);
        ctx.textAlign = 'right';
        ctx.fillText(value, centerX + 150, judgementYStart + index * 40);
        ctx.restore();
    });

    const accuracy = scoreManager.getAccuracy();
    let grade = 'D';
    if (accuracy >= 98) grade = 'S';
    else if (accuracy >= 94) grade = 'A';
    else if (accuracy >= 90) grade = 'B';
    else if (accuracy >= 80) grade = 'C';

    ctx.save();
    ctx.globalAlpha = resultsState.gradeAlpha;
    const gradeScale = 1 + (1 - resultsState.gradeAlpha) * 0.5;
    ctx.font = `${80 * gradeScale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(grade, centerX, gameCanvas.value.height - 200);
    ctx.restore();

    if (resultsState.animationPhase === 'done') {
        const backBtn = uiElements.results.backButton;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
        ctx.fillStyle = 'black';
        ctx.font = '24px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('Back to Song Select', backBtn.x + backBtn.width / 2, backBtn.y + backBtn.height / 2);
    }
};

let activeSlider = null;
const pointerState = {
    isDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
};

const handlePress = (event) => {
  event.preventDefault();
  const rect = gameCanvas.value.getBoundingClientRect();
  const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
  const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

  pointerState.isDown = true;
  pointerState.startX = x;
  pointerState.startY = y;
  pointerState.startTime = performance.now();
  pointerState.lastX = x;
  pointerState.lastY = y;
  pointerState.lastTime = pointerState.startTime;
  pointerState.velocityX = 0;
  pointerState.velocityY = 0;

  switch (gameState.current) {
    case 'title':
      gameState.current = 'songSelect';
      break;
    case 'songSelect':
      if (Math.abs(y - gameCanvas.value.height / 2) < CARD_HEIGHT * SELECTED_CARD_SCALE) {
        const selectedCard = songSelectState.cards[songSelectState.selectedIndex];
        const cardRenderX = selectedCard.x - songSelectState.currentScrollX - selectedCard.width / 2;
        if (x > cardRenderX && x < cardRenderX + selectedCard.width) {
            const selectedSong = songLibrary[songSelectState.selectedIndex];
            noteManager.loadChart(selectedSong.chart);
            audioElement.value.play().catch(e => console.error("Audio error:", e));
            gameState.current = 'playing';
            gameStartTime = null;
        } else {
            songSelectState.isDragging = true;
            songSelectState.dragStartX = x - songSelectState.currentScrollX;
        }
      }
      break;
    case 'playing': {
      const pb = uiElements.pauseButton;
      if (x > pb.x && x < pb.x + pb.width && y > pb.y && y < pb.y + pb.height) {
        audioElement.value.pause();
        gameState.current = 'paused';
        return;
      }
      const gameTime = audioElement.value.currentTime * 1000;
      const tapResult = noteManager.checkTapHit(gameTime);
      if (tapResult) {
          scoreManager.onHit(tapResult.judgement);
          effectManager.createExplosion(tapResult.note.x, judgementLine.y, tapResult.note.color);
          effectManager.createJudgementText(tapResult.note.x, judgementLine.y - 50, tapResult.judgement, tapResult.note.color);
          audioManager.playHitSound();
          judgementLine.flash(tapResult.note.color);
          dynamicBackground.triggerEffect();
          if (tapResult.judgement === 'Perfect') {
            effectManager.createShockwave(tapResult.note.x, judgementLine.y, tapResult.note.color);
          }
          return;
      }
      const holdResult = noteManager.checkHoldStart(gameTime);
      if (holdResult) {
          scoreManager.onHit(holdResult.judgement);
          effectManager.createJudgementText(holdResult.note.x, judgementLine.y - 50, holdResult.judgement, holdResult.note.color);
          audioManager.playHitSound();
          return;
      }
      const dragResult = noteManager.checkDragStart(gameTime);
      if (dragResult) {
          scoreManager.onHit(dragResult.judgement);
          effectManager.createJudgementText(dragResult.note.x, judgementLine.y - 50, dragResult.judgement, dragResult.note.color);
          audioManager.playHitSound();
      }
      break;
    }
    case 'paused': {
        const { resumeButton, retryButton, settingsButton } = uiElements.paused;
        if (x > resumeButton.x && x < resumeButton.x + resumeButton.width && y > resumeButton.y && y < resumeButton.y + resumeButton.height) {
            audioElement.value.play();
            gameState.current = 'playing';
        } else if (x > retryButton.x && x < retryButton.x + retryButton.width && y > retryButton.y && y < retryButton.y + retryButton.height) {
            retryCurrentSong();
        } else if (x > settingsButton.x && x < settingsButton.x + settingsButton.width && y > settingsButton.y && y < settingsButton.y + settingsButton.height) {
            gameState.current = 'settings';
        }
        break;
    }
    case 'settings': {
        const backBtn = uiElements.settings.backButton;
        if (x > backBtn.x && x < backBtn.x + backBtn.width && y > backBtn.y && y < backBtn.y + backBtn.height) {
            gameState.current = 'paused';
            return;
        }
        for (const [key, slider] of Object.entries(uiElements.settings)) {
            if (slider.label && x > slider.x && x < slider.x + slider.width && y > slider.y - 10 && y < slider.y + slider.height + 10) {
                activeSlider = key;
                updateSlider(x);
                break;
            }
        }
        break;
    }
    case 'results': {
        const backBtn = uiElements.results.backButton;
        if (x > backBtn.x && x < backBtn.x + backBtn.width && y > backBtn.y && y < backBtn.y + backBtn.height) {
            scoreManager.reset();
            noteManager.loadChart(null);
            gameState.current = 'songSelect';
        }
        break;
    }
  }
};

const handleMove = (event) => {
    event.preventDefault();
    const rect = gameCanvas.value.getBoundingClientRect();
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top;

    if (!pointerState.isDown) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - pointerState.lastTime;

    if (deltaTime > 0) {
        pointerState.velocityX = (x - pointerState.lastX) / deltaTime;
        pointerState.velocityY = (y - pointerState.lastY) / deltaTime;
    }

    pointerState.lastX = x;
    pointerState.lastY = y;
    pointerState.lastTime = currentTime;

    if (gameState.current === 'songSelect' && songSelectState.isDragging) {
        songSelectState.targetScrollX = x - songSelectState.dragStartX;
    } else if (gameState.current === 'settings' && activeSlider) {
        updateSlider(x);
    } else if (gameState.current === 'playing' && noteManager) {
        noteManager.checkDragUpdate(x);
    }
};

const updateSlider = (x) => {
    const slider = uiElements.settings[activeSlider];
    let valueRatio = (x - slider.x) / slider.width;
    valueRatio = Math.max(0, Math.min(1, valueRatio));
    settings[activeSlider] = slider.min + (slider.max - slider.min) * valueRatio;
    applySettings();
};

const handleRelease = (event) => {
  event.preventDefault();
  pointerState.isDown = false;

  if (gameState.current === 'playing' && noteManager) {
    const gameTime = audioElement.value.currentTime * 1000;
    const flickResult = noteManager.checkFlickHit(gameTime, pointerState.velocityY);
    if (flickResult) {
        scoreManager.onHit(flickResult.judgement);
        effectManager.createExplosion(flickResult.note.x, judgementLine.y, flickResult.note.color);
        effectManager.createJudgementText(flickResult.note.x, judgementLine.y - 50, flickResult.judgement, flickResult.note.color);
        audioManager.playHitSound();
        judgementLine.flash(flickResult.note.color);
        dynamicBackground.triggerEffect();
        if (flickResult.judgement === 'Perfect') {
            effectManager.createShockwave(flickResult.note.x, judgementLine.y, flickResult.note.color);
        }
    }

    noteManager.checkHoldEnd();
    noteManager.checkDragEnd();
  } else if (gameState.current === 'songSelect') {
    songSelectState.isDragging = false;
  }
  if (activeSlider) {
      activeSlider = null;
      saveSettings();
  }
};

const gameLoop = () => {
  if (!ctx || !gameCanvas.value) return;

  switch (gameState.current) {
    case 'title': updateTitle(); break;
    case 'songSelect': updateSongSelect(); break;
    case 'playing': updatePlaying(); break;
    case 'paused': break;
    case 'settings': break;
    case 'results': updateResults(); break;
  }

  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
  switch (gameState.current) {
    case 'title': drawTitle(); break;
    case 'songSelect': drawSongSelect(); break;
    case 'playing': drawPlaying(); break;
    case 'paused':
        drawPlaying();
        drawPaused();
        break;
    case 'settings': drawSettings(); break;
    case 'results': drawResults(); break;
  }

  requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
.game-container { position: relative; width: 100vw; height: 100vh; }
.game-canvas { display: block; background-color: #1a1a1a; }
</style>
