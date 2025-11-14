<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <!-- The start overlay is now controlled by the 'title' game state -->
    <audio ref="audioElement" :src="songUrl" style="display: none;"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
const songUrl = ref('');
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
      noteSize: { label: 'Note Size', x: 0, y: 0, width: 300, height: 20, value: 1, min: 0.5, max: 2 },
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
let titleCrystals = [];

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
    noteSize: 1, // Add noteSize setting
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
  dynamicBackground = new DynamicBackground(gameCanvas.value.width, gameCanvas.value.height);

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
  initializeTitleCrystals();
  loadSettings();
  gameLoop();

  // TODO: Future implementation for external controls or testing might go here.
};

const initializeTitleCrystals = () => {
    titleCrystals = [];
    const crystalCount = 15;
    for (let i = 0; i < crystalCount; i++) {
        titleCrystals.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            z: Math.random() * 0.5 + 0.5, // Depth for parallax
            size: Math.random() * 40 + 20, // Larger than background crystals
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
    }
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
    if (noteManager) {
        noteManager.setNoteSpeed(settings.noteSpeed);
        noteManager.setNoteSize(settings.noteSize);
    }
    if (audioManager) {
        audioManager.setBgmVolume(settings.bgmVolume);
        audioManager.setSfxVolume(settings.sfxVolume);
    }
    if (dynamicBackground) dynamicBackground.setBrightness(settings.bgBrightness);
};

const retryCurrentSong = () => {
    scoreManager.reset();
    const selectedSong = songLibrary[songSelectState.selectedIndex];
    // Deep copy the chart to ensure a fresh state
    const chartCopy = JSON.parse(JSON.stringify(selectedSong.chart));
    noteManager.loadChart(chartCopy);
    audioManager.resetMusic();
    audioManager.playMusic();
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
    const width = gameCanvas.value.width;
    const height = gameCanvas.value.height;

    // Update foreground crystals
    for (const crystal of titleCrystals) {
        crystal.x += crystal.vx;
        crystal.y += crystal.vy;
        crystal.rotation += crystal.rotationSpeed;

        // Bounce off edges
        if (crystal.x < 0 || crystal.x > width) crystal.vx *= -1;
        if (crystal.y < 0 || crystal.y > height) crystal.vy *= -1;
    }
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

  const currentChart = noteManager.getCurrentChart();
  if (currentChart && gameTime >= currentChart.duration) {
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
    dynamicBackground.update();
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
    ctx.fillStyle = 'rgba(10, 10, 20, 0.7)'; // Slightly bluer overlay
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

    const width = gameCanvas.value.width;
    const height = gameCanvas.value.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // --- Draw Foreground Crystals with Parallax ---
    const parallaxStrength = 40;
    const mouseX = pointerState.currentX - centerX;
    const mouseY = pointerState.currentY - centerY;

    for (const crystal of titleCrystals) {
        const parallaxX = (mouseX / centerX) * parallaxStrength * crystal.z;
        const parallaxY = (mouseY / centerY) * parallaxStrength * crystal.z;

        ctx.save();
        ctx.translate(crystal.x + parallaxX, crystal.y + parallaxY);
        ctx.rotate(crystal.rotation * Math.PI / 180);

        ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 * crystal.z})`;
        ctx.fillStyle = `rgba(0, 50, 70, ${0.2 * crystal.z})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(0, -crystal.size); // Top point
        ctx.lineTo(crystal.size * 0.8, 0); // Right point
        ctx.lineTo(0, crystal.size); // Bottom point
        ctx.lineTo(-crystal.size * 0.8, 0); // Left point
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // --- Stylized Title ---
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 30; // Increased glow
    ctx.font = '100px sans-serif'; // Larger font
    ctx.textAlign = 'center';
    ctx.fillText('TheEnd', centerX, centerY - 50);
    ctx.shadowBlur = 0;

    // --- "Click to Start" with smoother flashing animation ---
    const flash = (Math.sin(performance.now() * 0.0015) + 1) / 2; // Smoother sine wave
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + flash * 0.4})`;
    ctx.font = '28px sans-serif';
    ctx.fillText('Click anywhere to begin', centerX, centerY + 50);
};

const drawSongSelect = () => {
    dynamicBackground.draw(ctx);
    ctx.save();
    ctx.translate(0, gameCanvas.value.height / 2 - CARD_HEIGHT / 2);

    songSelectState.cards.forEach((card, index) => {
        const cardRenderX = card.x - songSelectState.currentScrollX;
        let scale = 1.0;
        let distance = Math.abs(gameCanvas.value.width / 2 - cardRenderX);
        let distanceFactor = Math.max(0, 1 - distance / (gameCanvas.value.width / 2));

        scale = 1 + (SELECTED_CARD_SCALE - 1) * distanceFactor;

        const scaledWidth = card.width * scale;
        const scaledHeight = card.height * scale;
        const renderX = cardRenderX - scaledWidth / 2;
        const renderY = (CARD_HEIGHT - scaledHeight) / 2;

        ctx.save();
        ctx.globalAlpha = 0.3 + 0.7 * distanceFactor;

        // --- Redesigned Card ---
        // Base shape
        ctx.fillStyle = `rgba(20, 30, 40, ${0.5 + 0.3 * distanceFactor})`;
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + 0.5 * distanceFactor})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(renderX + 10, renderY);
        ctx.lineTo(renderX + scaledWidth - 10, renderY);
        ctx.lineTo(renderX + scaledWidth, renderY + 10);
        ctx.lineTo(renderX + scaledWidth, renderY + scaledHeight - 10);
        ctx.lineTo(renderX + scaledWidth - 10, renderY + scaledHeight);
        ctx.lineTo(renderX + 10, renderY + scaledHeight);
        ctx.lineTo(renderX, renderY + scaledHeight - 10);
        ctx.lineTo(renderX, renderY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = 'white';
        ctx.font = `bold ${30 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(card.song.title, cardRenderX, renderY + scaledHeight * 0.45);

        // Artist
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `italic ${18 * scale}px sans-serif`;
        ctx.fillText(card.song.artist, cardRenderX, renderY + scaledHeight * 0.65);

        // Decorative lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(renderX + 20, renderY + scaledHeight * 0.8);
        ctx.lineTo(renderX + scaledWidth - 20, renderY + scaledHeight * 0.8);
        ctx.stroke();


        if (index === songSelectState.selectedIndex) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'cyan';
            ctx.shadowBlur = 25; // Increased glow for selected

            ctx.beginPath(); // Redraw border with glow
            ctx.moveTo(renderX + 10, renderY);
            ctx.lineTo(renderX + scaledWidth - 10, renderY);
            ctx.lineTo(renderX + scaledWidth, renderY + 10);
            ctx.lineTo(renderX + scaledWidth, renderY + scaledHeight - 10);
            ctx.lineTo(renderX + scaledWidth - 10, renderY + scaledHeight);
            ctx.lineTo(renderX + 10, renderY + scaledHeight);
            ctx.lineTo(renderX, renderY + scaledHeight - 10);
            ctx.lineTo(renderX, renderY + 10);
            ctx.closePath();
            ctx.stroke();

            // Animated selection indicator
            const animProgress = (performance.now() * 0.001) % 1;
            const indicatorLength = scaledWidth / 2;
            const indicatorX = renderX + (scaledWidth - indicatorLength) / 2 + (animProgress * indicatorLength) - (indicatorLength/2);

            ctx.fillStyle = 'cyan';
            ctx.globalAlpha = (Math.sin(performance.now() * 0.005) + 1) / 2 * 0.8;
            ctx.fillRect(indicatorX, renderY + scaledHeight - 5, indicatorLength, 2);

        }

        ctx.restore();
    });

    ctx.restore();
};

const drawHUD = (gameTime) => {
    const width = gameCanvas.value.width;
    const height = gameCanvas.value.height;

    // Background for the score
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(width - 250, 20, 230, 60);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(width - 250, 20, 230, 60);

    // Score
    drawStylizedNumber(ctx, scoreManager.getScore().toString().padStart(7, '0'), width - 30, 30, 4, 'white');

    // Combo
    if (scoreManager.getCombo() > 1) {
        const comboText = scoreManager.getCombo().toString();
        const textWidth = comboText.length * 5 * 8 + (comboText.length - 1) * 8;
        const comboX = width / 2;
        const comboY = height * 0.4;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(comboX - textWidth/2 - 20, comboY - 20, textWidth + 40, 80);
        ctx.strokeRect(comboX - textWidth/2 - 20, comboY - 20, textWidth + 40, 80);

        drawStylizedNumber(ctx, comboText, comboX + textWidth / 2, comboY, 8, 'white');
    }

    // Progress Bar
    const currentChart = noteManager.getCurrentChart();
    if (currentChart && currentChart.duration > 0) {
        const progress = Math.min(gameTime / currentChart.duration, 1.0);
        const barWidth = width * 0.4;
        const barX = (width - barWidth) / 2;
        const barY = 45;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, 10);

        ctx.fillStyle = 'cyan';
        ctx.fillRect(barX, barY, barWidth * progress, 10);

        // Progress marker
        const markerX = barX + barWidth * progress;
        ctx.fillStyle = 'white';
        ctx.fillRect(markerX - 2, barY - 5, 4, 20);
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 10;
        ctx.fillRect(markerX - 2, barY - 5, 4, 20);
        ctx.shadowBlur = 0;
    }
};

const drawPlaying = (gameTime) => {
  dynamicBackground.draw(ctx);

  // Pause Button
  const pb = uiElements.pauseButton;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(pb.x, pb.y, pb.width, pb.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(pb.x + 15, pb.y + 10, 8, 30);
  ctx.fillRect(pb.x + 30, pb.y + 10, 8, 30);

  judgementLine.draw();
  noteManager.draw(ctx, judgementLine.x);
  effectManager.draw(ctx);
  drawHUD(gameTime);
};

const drawPaused = () => {
    // Dim the background
    ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

    const centerX = gameCanvas.value.width / 2;
    const centerY = gameCanvas.value.height / 2;

    // --- Paused Title ---
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 20;
    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', centerX, centerY - 150);
    ctx.shadowBlur = 0;

    // --- Buttons ---
    const buttons = uiElements.paused;
    Object.entries(buttons).forEach(([key, btn]) => {
        const text = key.replace('Button', '').toUpperCase();

        // Check for hover (using pointerState as a proxy)
        const isHovered = pointerState.currentX > btn.x && pointerState.currentX < btn.x + btn.width &&
                          pointerState.currentY > btn.y && pointerState.currentY < btn.y + btn.height;

        // --- Button Shape ---
        ctx.strokeStyle = isHovered ? 'white' : 'cyan';
        ctx.fillStyle = 'rgba(20, 30, 40, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowColor = isHovered ? 'white' : 'cyan';
        ctx.shadowBlur = 15;

        // Draw a stylized rectangle with cut corners
        const cornerCut = 10;
        ctx.beginPath();
        ctx.moveTo(btn.x + cornerCut, btn.y);
        ctx.lineTo(btn.x + btn.width - cornerCut, btn.y);
        ctx.lineTo(btn.x + btn.width, btn.y + cornerCut);
        ctx.lineTo(btn.x + btn.width, btn.y + btn.height - cornerCut);
        ctx.lineTo(btn.x + btn.width - cornerCut, btn.y + btn.height);
        ctx.lineTo(btn.x + cornerCut, btn.y + btn.height);
        ctx.lineTo(btn.x, btn.y + btn.height - cornerCut);
        ctx.lineTo(btn.x, btn.y + cornerCut);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // --- Button Text ---
        ctx.fillStyle = isHovered ? 'white' : 'rgba(255, 255, 255, 0.8)';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'transparent'; // No shadow for text
        ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    });
     ctx.shadowBlur = 0; // Reset shadow for other drawing operations
};

const drawSettings = () => {
    // Use the dynamic background
    dynamicBackground.draw(ctx);
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)'; // Consistent overlay
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

    const centerX = gameCanvas.value.width / 2;

    // --- Redesigned Back Button ---
    const backBtn = uiElements.settings.backButton;
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;
    ctx.strokeRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Back', backBtn.x + backBtn.width / 2, backBtn.y + backBtn.height / 2);
    ctx.shadowBlur = 0;

    // --- Title ---
    ctx.fillStyle = 'white';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Settings', centerX, 80);

    // --- Redesigned Sliders ---
    Object.entries(uiElements.settings).forEach(([key, slider]) => {
        if (!slider.label) return;

        const valueRatio = (settings[key] - slider.min) / (slider.max - slider.min);
        const handleX = slider.x + valueRatio * slider.width;

        // Label and Value
        ctx.fillStyle = 'white';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(slider.label, slider.x, slider.y - 25);
        ctx.textAlign = 'right';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(settings[key].toFixed(2), slider.x + slider.width, slider.y - 25);

        // Slider Track
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(slider.x, slider.y);
        ctx.lineTo(slider.x + slider.width, slider.y);
        ctx.stroke();

        // Slider Progress
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(slider.x, slider.y);
        ctx.lineTo(handleX, slider.y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Slider Handle (Rhombus)
        ctx.save();
        ctx.translate(handleX, slider.y);
        ctx.rotate(45 * Math.PI / 180);
        ctx.fillStyle = activeSlider === key ? '#FFFFFF' : 'cyan';
        ctx.shadowColor = activeSlider === key ? '#FFFFFF' : 'cyan';
        ctx.shadowBlur = 15;
        ctx.fillRect(-12, -12, 24, 24);
        ctx.restore();
    });
};

const drawResults = () => {
    dynamicBackground.draw(ctx);
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
    const centerX = gameCanvas.value.width / 2;

    // --- Title ---
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 20;
    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RESULTS', centerX, 80);
    ctx.shadowBlur = 0;

    // --- Score & Combo Box ---
    const scoreBoxY = 150;
    const scoreBoxWidth = 400;
    const scoreBoxHeight = 120;
    ctx.strokeStyle = 'cyan';
    ctx.fillStyle = 'rgba(20, 30, 40, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;
    ctx.strokeRect(centerX - scoreBoxWidth / 2, scoreBoxY, scoreBoxWidth, scoreBoxHeight);
    ctx.fillRect(centerX - scoreBoxWidth / 2, scoreBoxY, scoreBoxWidth, scoreBoxHeight);
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', centerX - scoreBoxWidth / 2 + 20, scoreBoxY + 35);
    drawStylizedNumber(ctx, resultsState.displayScore.toString().padStart(7, '0'), centerX + scoreBoxWidth / 2 - 20, scoreBoxY + 15, 4, 'white');

    // Max Combo
    ctx.fillText('MAX COMBO', centerX - scoreBoxWidth / 2 + 20, scoreBoxY + 85);
    drawStylizedNumber(ctx, scoreManager.getMaxCombo().toString(), centerX + scoreBoxWidth / 2 - 20, scoreBoxY + 65, 4, 'white');


    // --- Judgements Box ---
    const judgementsBoxY = 300;
    const judgementsBoxWidth = 400;
    const judgementsBoxHeight = 200;
    ctx.strokeStyle = 'cyan';
    ctx.fillStyle = 'rgba(20, 30, 40, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;
    ctx.strokeRect(centerX - judgementsBoxWidth / 2, judgementsBoxY, judgementsBoxWidth, judgementsBoxHeight);
    ctx.fillRect(centerX - judgementsBoxWidth / 2, judgementsBoxY, judgementsBoxWidth, judgementsBoxHeight);
    ctx.shadowBlur = 0;

    const judgements = scoreManager.getJudgementCounts();
    const judgementYStart = judgementsBoxY + 40;
    Object.entries(judgements).forEach(([key, value], index) => {
        ctx.save();
        ctx.globalAlpha = resultsState.judgementAlpha[index];
        ctx.fillStyle = 'white';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(key.toUpperCase(), centerX - judgementsBoxWidth / 2 + 30, judgementYStart + index * 40);
        ctx.textAlign = 'right';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(value, centerX + judgementsBoxWidth / 2 - 30, judgementYStart + index * 40);
        ctx.restore();
    });

    // --- Grade ---
    const accuracy = scoreManager.getAccuracy();
    let grade = 'D';
    if (accuracy >= 98) grade = 'S';
    else if (accuracy >= 94) grade = 'A';
    else if (accuracy >= 90) grade = 'B';
    else if (accuracy >= 80) grade = 'C';

    ctx.save();
    ctx.globalAlpha = resultsState.gradeAlpha;
    const gradeScale = 1 + Easing.easeOutElastic(resultsState.gradeAlpha) * 0.2;
    ctx.font = `bold ${150 * gradeScale}px sans-serif`;
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 40;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(grade, centerX, gameCanvas.value.height - 200);
    ctx.restore();

    // --- Back Button ---
    if (resultsState.animationPhase === 'done') {
        const backBtn = uiElements.results.backButton;
        const isHovered = pointerState.currentX > backBtn.x && pointerState.currentX < backBtn.x + backBtn.width &&
                          pointerState.currentY > backBtn.y && pointerState.currentY < backBtn.y + backBtn.height;

        ctx.strokeStyle = isHovered ? 'white' : 'cyan';
        ctx.fillStyle = 'rgba(20, 30, 40, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowColor = isHovered ? 'white' : 'cyan';
        ctx.shadowBlur = 15;

        const cornerCut = 10;
        ctx.beginPath();
        ctx.moveTo(backBtn.x + cornerCut, backBtn.y);
        ctx.lineTo(backBtn.x + backBtn.width - cornerCut, backBtn.y);
        ctx.lineTo(backBtn.x + backBtn.width, backBtn.y + cornerCut);
        ctx.lineTo(backBtn.x + backBtn.width, backBtn.y + backBtn.height - cornerCut);
        ctx.lineTo(backBtn.x + backBtn.width - cornerCut, backBtn.y + backBtn.height);
        ctx.lineTo(backBtn.x + cornerCut, backBtn.y + backBtn.height);
        ctx.lineTo(backBtn.x, backBtn.y + backBtn.height - cornerCut);
        ctx.lineTo(backBtn.x, backBtn.y + cornerCut);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHovered ? 'white' : 'rgba(255, 255, 255, 0.8)';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'transparent';
        ctx.fillText('BACK TO SELECT', backBtn.x + backBtn.width / 2, backBtn.y + backBtn.height / 2);
    }
    ctx.shadowBlur = 0;
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
    currentX: window.innerWidth / 2, // For parallax
    currentY: window.innerHeight / 2, // For parallax
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
    case 'songSelect': {
      const centerX = gameCanvas.value.width / 2;
      const centerY = gameCanvas.value.height / 2;

      // Define the hitbox for the selected, scaled-up card which is always in the center.
      const scaledWidth = CARD_WIDTH * SELECTED_CARD_SCALE;
      const scaledHeight = CARD_HEIGHT * SELECTED_CARD_SCALE;
      const boxX = centerX - scaledWidth / 2;
      const boxY = centerY - scaledHeight / 2;

      // Also check if the selected card is actually near the center, to avoid clicks while scrolling.
      const selectedCard = songSelectState.cards[songSelectState.selectedIndex];
      const cardScreenX = selectedCard.x - songSelectState.currentScrollX;
      const isCardCentered = Math.abs(cardScreenX - centerX) < 50; // Generous tolerance

      // If the click is inside the central hitbox and the card is centered, start the game.
      if (isCardCentered && x > boxX && x < boxX + scaledWidth && y > boxY && y < boxY + scaledHeight) {
          const selectedSong = songLibrary[songSelectState.selectedIndex];
          songUrl.value = selectedSong.audioUrl;

          // Wait for the new audio to be ready before playing
          audioElement.value.addEventListener('canplaythrough', () => {
              const chartCopy = JSON.parse(JSON.stringify(selectedSong.chart));
              noteManager.loadChart(chartCopy);
              audioManager.playMusic();
              gameState.current = 'playing';
              gameStartTime = null;
          }, { once: true });

          audioElement.value.load();
      } else {
          // Otherwise, start dragging. Restore the original, correct drag logic.
          songSelectState.isDragging = true;
          songSelectState.dragStartX = x - songSelectState.currentScrollX;
      }
      break;
    }
    case 'playing': {
      const pb = uiElements.pauseButton;
      if (x > pb.x && x < pb.x + pb.width && y > pb.y && y < pb.y + pb.height) {
        audioElement.value.pause();
        gameState.current = 'paused';
        return;
      }
      const gameTime = audioElement.value.currentTime * 1000;
      const tapResult = noteManager.checkTapHit(gameTime, x, y);
      if (tapResult) {
          scoreManager.onHit(tapResult.judgement);
          effectManager.createExplosion(tapResult.note.x, judgementLine.y, tapResult.note.color, tapResult.judgement);
          effectManager.createJudgementText(tapResult.note.x, judgementLine.y - 50, tapResult.judgement, tapResult.note.color);
          audioManager.playSound(tapResult.note.type);
          judgementLine.flash(tapResult.note.color);
          dynamicBackground.triggerEffect();
          if (tapResult.judgement === 'Perfect') {
            effectManager.createShockwave(tapResult.note.x, judgementLine.y, tapResult.note.color);
          }
          return;
      }
      const holdResult = noteManager.checkHoldStart(gameTime, x, y);
      if (holdResult) {
          scoreManager.onHit(holdResult.judgement);
          effectManager.createJudgementText(holdResult.note.x, judgementLine.y - 50, holdResult.judgement, holdResult.note.color);
          audioManager.playSound(holdResult.note.type);
          return;
      }
      const dragResult = noteManager.checkDragStart(gameTime, x, y);
      if (dragResult) {
          scoreManager.onHit(dragResult.judgement);
          effectManager.createJudgementText(dragResult.note.x, judgementLine.y - 50, dragResult.judgement, dragResult.note.color);
          audioManager.playSound(dragResult.note.type);
          return;
      }
      const catchResult = noteManager.checkCatchHit(gameTime, x, y);
      if (catchResult) {
          scoreManager.onHit(catchResult.judgement);
          effectManager.createExplosion(catchResult.note.x, judgementLine.y, catchResult.note.color, catchResult.judgement);
          effectManager.createJudgementText(catchResult.note.x, judgementLine.y - 50, catchResult.judgement, catchResult.note.color);
          audioManager.playSound(catchResult.note.type);
          judgementLine.flash(catchResult.note.color);
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
        if (resultsState.animationPhase === 'done') {
            const backBtn = uiElements.results.backButton;
            if (x > backBtn.x && x < backBtn.x + backBtn.width && y > backBtn.y && y < backBtn.y + backBtn.height) {
                scoreManager.reset();
                noteManager.loadChart(null);
                gameState.current = 'songSelect';
            }
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

    pointerState.currentX = x;
    pointerState.currentY = y;

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
  const rect = gameCanvas.value.getBoundingClientRect();
  const x = (event.changedTouches ? event.changedTouches[0].clientX : event.clientX) - rect.left;
  const y = (event.changedTouches ? event.changedTouches[0].clientY : event.clientY) - rect.top;
  pointerState.isDown = false;

  if (gameState.current === 'playing' && noteManager) {
    const gameTime = audioElement.value.currentTime * 1000;
    const flickResult = noteManager.checkFlickHit(gameTime, x, y, pointerState.velocityY);
    if (flickResult) {
        scoreManager.onHit(flickResult.judgement);
        effectManager.createFlickEffect(flickResult.note.x, judgementLine.y, flickResult.note.color); // Use the new flick effect
        effectManager.createJudgementText(flickResult.note.x, judgementLine.y - 50, flickResult.judgement, flickResult.note.color);
        audioManager.playSound(flickResult.note.type);
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

  // This part remains outside the update switch to ensure gameTime is always available for paused draw
  let gameTime = audioElement.value.currentTime * 1000;
  if (audioElement.value.paused && gameTime === 0) {
    if (gameStartTime === null) { gameStartTime = performance.now(); }
    gameTime = performance.now() - gameStartTime;
  }

  switch (gameState.current) {
    case 'title': drawTitle(); break;
    case 'songSelect': drawSongSelect(); break;
    case 'playing': drawPlaying(gameTime); break;
    case 'paused':
        drawPlaying(gameTime);
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
