<template>
  <div class="game-container">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
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

// Refs for DOM elements
const gameCanvas = ref(null);
const audioElement = ref(null);

// Game State Management
const gameState = ref('title');
const settings = reactive({
  noteSpeed: 3.0,
  bgmVolume: 0.5,
  sfxVolume: 0.8,
  bgBrightness: 1.0,
});

const saveSettings = () => {
  try {
    localStorage.setItem('theEndSettings', JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('theEndSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Assign to settings, keeping reactivity
      Object.assign(settings, parsed);
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
};

let ctx = null;
let judgementLine = null;
let noteManager = null;
let effectManager = null;
let scoreManager = null;
let audioManager = null;
let dynamicBackground = null;

// Title screen specific state
let titleTextAlpha = ref(0);
let titleTextFadeIn = true;
let titleCrystals = [];

const songBoxWidth = 400;
const songBoxHeight = 100;
const songBoxGap = 20;

const initializeTitleScreen = () => {
  titleCrystals = [];
  if (!gameCanvas.value) return;
  for (let i = 0; i < 20; i++) { // Create 20 crystals
    titleCrystals.push({
      x: Math.random() * gameCanvas.value.width,
      y: Math.random() * gameCanvas.value.height,
      size: Math.random() * 25 + 10, // size 10 to 35
      vx: (Math.random() - 0.5) * 0.4, // slow horizontal drift
      vy: (Math.random() - 0.5) * 0.4, // slow vertical drift
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.3 + 0.1 // 0.1 to 0.4 opacity
    });
  }
};

const initializeGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth;
    gameCanvas.value.height = window.innerHeight;
    // Re-initialize title screen elements on resize to fit new dimensions
    if (gameState.value === 'title') {
      initializeTitleScreen();
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  judgementLine = new JudgementLine(gameCanvas.value);
  scoreManager = new ScoreManager();
  audioManager = new AudioManager(audioElement.value);
  noteManager = new NoteManager(gameCanvas.value, null, scoreManager, judgementLine, audioManager, settings.noteSpeed);
  effectManager = new EffectManager();
  dynamicBackground = new DynamicBackground(gameCanvas.value);

  initializeTitleScreen(); // Initialize crystals first time

  gameCanvas.value.addEventListener('mousedown', handlePress);
  gameCanvas.value.addEventListener('touchstart', handlePress);
  gameCanvas.value.addEventListener('mouseup', handleRelease);
  gameCanvas.value.addEventListener('touchend', handleRelease);
  gameCanvas.value.addEventListener('mousemove', handleMove);
  gameCanvas.value.addEventListener('touchmove', handleMove);

  loadSettings();
  // Apply loaded settings
  audioManager.setMusicVolume(settings.bgmVolume);
  audioManager.setSfxVolume(settings.sfxVolume);
  dynamicBackground.setBrightness(settings.bgBrightness);

  console.log('Game initialized.');
  gameLoop();
};

const startGame = (chart) => {
  noteManager.loadChart(chart);
  audioManager.resetMusic();
  audioManager.playMusic();
  // We change state immediately, audioManager will handle playback errors gracefully
  gameState.value = 'playing';
};

onMounted(initializeGame);

// UI Element Positions
const pauseButton = { x: 20, y: 20, width: 40, height: 40 };
// This object will be populated with coordinates dynamically in the draw function
const settingsMenu = {
    buttons: {},
    controls: {
        noteSpeed: { minusButton: {}, plusButton: {} },
        bgmVolume: { minusButton: {}, plusButton: {} },
        sfxVolume: { minusButton: {}, plusButton: {} },
        bgBrightness: { minusButton: {}, plusButton: {} },
    }
};


const handlePress = (event) => {
  event.preventDefault();
  const rect = gameCanvas.value.getBoundingClientRect();
  const x = (event.clientX ?? event.touches[0].clientX) - rect.left;
  const y = (event.clientY ?? event.touches[0].clientY) - rect.top;

  switch (gameState.value) {
    case 'title':
      gameState.value = 'songSelect';
      break;
    case 'songSelect':
      const centerX = gameCanvas.value.width / 2;
      songLibrary.forEach((song, index) => {
        const boxX = centerX - songBoxWidth / 2;
        const boxY = 150 + index * (songBoxHeight + songBoxGap);
        if (x >= boxX && x <= boxX + songBoxWidth && y >= boxY && y <= boxY + songBoxHeight) {
          startGame(song.chart);
        }
      });
      break;
    case 'playing':
      // Check for pause button press first
      if (x >= pauseButton.x && x <= pauseButton.x + pauseButton.width && y >= pauseButton.y && y <= pauseButton.y + pauseButton.height) {
        gameState.value = 'paused';
        audioManager.pauseMusic();
        return;
      }

      if (noteManager && effectManager && scoreManager && audioManager) {
        const hitTapNote = noteManager.checkTapHit();
        const startedHoldNote = noteManager.checkHoldStart();
        const startedDragNote = noteManager.checkDragStart();

        if (hitTapNote || startedHoldNote || startedDragNote) {
            const note = hitTapNote || startedHoldNote || startedDragNote;
            if(hitTapNote) scoreManager.onHit();
            effectManager.createExplosion(note.x, note.y, note.color);
            audioManager.playHitSound();
            judgementLine.flash(note.color);
            dynamicBackground.triggerEffect();
        }
      }
      break;
    case 'paused':
      // Check for settings menu interactions
      // Check main action buttons
      for (const key in settingsMenu.buttons) {
          const btn = settingsMenu.buttons[key];
          if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
              switch(key) {
                  case 'resume':
                      gameState.value = 'playing';
                      audioManager.playMusic();
                      return;
                  case 'restart':
                      scoreManager.reset();
                      startGame(noteManager.chart);
                      return;
                  case 'exit':
                      gameState.value = 'songSelect';
                      scoreManager.reset();
                      audioManager.resetMusic();
                      return;
              }
          }
      }

      // Check all controls
      for (const key in settingsMenu.controls) {
        const control = settingsMenu.controls[key];
        const minusBtn = control.minusButton;
        const plusBtn = control.plusButton;

        let valueChanged = false;

        if (minusBtn.x && x >= minusBtn.x && x <= minusBtn.x + minusBtn.width && y >= minusBtn.y && y <= minusBtn.y + minusBtn.height) {
          switch(key) {
            case 'noteSpeed':
              settings.noteSpeed = Math.max(0.5, parseFloat((settings.noteSpeed - 0.5).toFixed(1)));
              if (noteManager) noteManager.setNoteSpeed(settings.noteSpeed);
              break;
            case 'bgmVolume':
              settings.bgmVolume = Math.max(0, parseFloat((settings.bgmVolume - 0.1).toFixed(1)));
              audioManager.setMusicVolume(settings.bgmVolume);
              break;
            case 'sfxVolume':
              settings.sfxVolume = Math.max(0, parseFloat((settings.sfxVolume - 0.1).toFixed(1)));
              audioManager.setSfxVolume(settings.sfxVolume);
              break;
            case 'bgBrightness':
              settings.bgBrightness = Math.max(0, parseFloat((settings.bgBrightness - 0.1).toFixed(1)));
              dynamicBackground.setBrightness(settings.bgBrightness);
              break;
          }
          valueChanged = true;
        }

        if (plusBtn.x && x >= plusBtn.x && x <= plusBtn.x + plusBtn.width && y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
          switch(key) {
            case 'noteSpeed':
              settings.noteSpeed = Math.min(10, parseFloat((settings.noteSpeed + 0.5).toFixed(1)));
              if (noteManager) noteManager.setNoteSpeed(settings.noteSpeed);
              break;
            case 'bgmVolume':
              settings.bgmVolume = Math.min(1, parseFloat((settings.bgmVolume + 0.1).toFixed(1)));
              audioManager.setMusicVolume(settings.bgmVolume);
              break;
            case 'sfxVolume':
              settings.sfxVolume = Math.min(1, parseFloat((settings.sfxVolume + 0.1).toFixed(1)));
              audioManager.setSfxVolume(settings.sfxVolume);
              break;
            case 'bgBrightness':
              settings.bgBrightness = Math.min(1, parseFloat((settings.bgBrightness + 0.1).toFixed(1)));
              dynamicBackground.setBrightness(settings.bgBrightness);
              break;
          }
          valueChanged = true;
        }

        if (valueChanged) {
          saveSettings();
          return;
        }
      }
      break;
    case 'results':
      scoreManager.reset();
      gameState.value = 'songSelect';
      break;
  }
};

const handleRelease = (event) => {
  event.preventDefault();
  if (gameState.value === 'playing') {
    noteManager.checkHoldEnd();
    noteManager.checkDragEnd();
  }
};

const handleMove = (event) => {
  event.preventDefault();
  if (gameState.value === 'playing') {
    const rect = gameCanvas.value.getBoundingClientRect();
    const x = (event.clientX ?? event.touches[0].clientX) - rect.left;
    noteManager.checkDragUpdate(x);
  }
};


const update = () => {
  // Always update background for a lively feel, even when paused
  dynamicBackground.update();

  switch (gameState.value) {
    case 'title':
      // Update blinking text
      if (titleTextFadeIn) {
        titleTextAlpha.value += 0.01;
        if (titleTextAlpha.value >= 1) titleTextFadeIn = false;
      } else {
        titleTextAlpha.value -= 0.01;
        if (titleTextAlpha.value <= 0.2) titleTextFadeIn = true;
      }
      // Update crystals
      titleCrystals.forEach(crystal => {
        crystal.x += crystal.vx;
        crystal.y += crystal.vy;
        crystal.rotation += crystal.rotationSpeed;
        // Wrap around screen edges for continuous floating
        if (crystal.x > gameCanvas.value.width + crystal.size) crystal.x = -crystal.size;
        if (crystal.x < -crystal.size) crystal.x = gameCanvas.value.width + crystal.size;
        if (crystal.y > gameCanvas.value.height + crystal.size) crystal.y = -crystal.size;
        if (crystal.y < -crystal.size) crystal.y = gameCanvas.value.height + crystal.size;
      });
      break;
    case 'playing':
      if (!audioElement.value) return;
      if (audioElement.value.ended) {
        gameState.value = 'results';
        audioManager.pauseMusic(); // Stop music when the song ends
        break;
      }
      const gameTime = audioElement.value.currentTime * 1000;
      judgementLine.update();
      noteManager.update(gameTime);
      effectManager.update();
      break;
    case 'paused':
      // Do nothing to freeze the game state
      break;
  }
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  // ctx.clearRect is no longer needed as dynamicBackground.draw handles the entire background now
  dynamicBackground.draw(ctx);

  switch (gameState.value) {
    case 'title':
      drawTitleScreen();
      break;
    case 'songSelect':
      drawSongSelectScreen();
      break;
    case 'playing':
      drawGameHUD();
      break;
    case 'paused':
      // Draw the frozen game state first
      drawGameHUD();
      // Then draw the settings menu overlay
      drawSettingsMenu();
      break;
    case 'results':
      drawResultsScreen();
      break;
  }
};

const drawResultsScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;
  ctx.fillStyle = 'white';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 15;
  ctx.fillText("Results", centerX, centerY - 200);
  ctx.font = '30px Arial';
  ctx.fillText("Final Score", centerX, centerY - 100);
  const score = scoreManager.getScore();
  const scoreDigitSize = 6;
  const scoreWidth = 7 * (3 * scoreDigitSize + scoreDigitSize);
  drawStylizedNumber(score, centerX - scoreWidth / 2, centerY - 80, scoreDigitSize, 'white');
  ctx.font = '30px Arial';
  ctx.fillText("Max Combo", centerX, centerY + 50);
  const maxCombo = scoreManager.getMaxCombo();
  const comboDigitSize = 6;
  const comboStr = String(maxCombo);
  const comboWidth = comboStr.length * (3 * comboDigitSize + comboDigitSize);
  drawStylizedNumber(maxCombo, centerX - comboWidth / 2, centerY + 70, comboDigitSize, 'white');
  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`;
  ctx.textAlign = 'center';
  ctx.fillText("Click to Continue", centerX, centerY + 200);
  ctx.restore();
};

const drawTitleScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  const centerY = gameCanvas.value.height / 2;

  // Draw floating crystals
  titleCrystals.forEach(crystal => {
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    ctx.rotate(crystal.rotation * Math.PI / 180);
    ctx.fillStyle = `rgba(200, 220, 255, ${crystal.alpha})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${crystal.alpha + 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(180, 210, 255, 0.7)';
    ctx.shadowBlur = 10;
    // Draw a rhombus shape
    ctx.beginPath();
    ctx.moveTo(0, -crystal.size);
    ctx.lineTo(crystal.size / 1.5, 0);
    ctx.lineTo(0, crystal.size);
    ctx.lineTo(-crystal.size / 1.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Draw the main title
  ctx.save();
  ctx.font = 'bold 120px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
  ctx.shadowBlur = 20;
  ctx.fillText("TheEnd", centerX, centerY - 50);
  ctx.restore();

  // Draw the "Click to Start" prompt
  ctx.save();
  ctx.font = '30px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${titleTextAlpha.value})`;
  ctx.textAlign = 'center';
  ctx.fillText("Click to Start", centerX, centerY + 50);
  ctx.restore();
};

const drawSongSelectScreen = () => {
  const centerX = gameCanvas.value.width / 2;
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText("Select a Song", centerX, 80);
  songLibrary.forEach((song, index) => {
    const boxX = centerX - songBoxWidth / 2;
    const boxY = 150 + index * (songBoxHeight + songBoxGap);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, songBoxWidth, songBoxHeight);
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(song.title, boxX + 20, boxY + 45);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '20px Arial';
    ctx.fillText(song.artist, boxX + 20, boxY + 75);
  });
};

const drawSettingsMenu = () => {
    const centerX = gameCanvas.value.width / 2;
    const centerY = gameCanvas.value.height / 2;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);

    // Menu Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.7)';
    ctx.shadowBlur = 15;
    ctx.fillText("Settings", centerX, centerY - 280);
    ctx.shadowBlur = 0;

    // --- Controls ---
    const controlsYstart = centerY - 180;
    const controlGap = 90;
    const btnSize = 40;

    const controlData = [
        { key: 'noteSpeed', label: 'Note Speed', value: settings.noteSpeed.toFixed(1) },
        { key: 'bgmVolume', label: 'BGM Volume', value: settings.bgmVolume.toFixed(1) },
        { key: 'sfxVolume', label: 'SFX Volume', value: settings.sfxVolume.toFixed(1) },
        { key: 'bgBrightness', label: 'BG Brightness', value: settings.bgBrightness.toFixed(1) },
    ];

    controlData.forEach((control, index) => {
        const controlY = controlsYstart + index * controlGap;

        // Label
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(control.label, centerX, controlY);

        // Value
        ctx.font = 'bold 32px Arial';
        ctx.fillText(control.value, centerX, controlY + 40);

        // Buttons
        const minusBtnData = { x: centerX - 120, y: controlY + 10, width: btnSize, height: btnSize };
        const plusBtnData = { x: centerX + 80, y: controlY + 10, width: btnSize, height: btnSize };

        settingsMenu.controls[control.key] = {
            minusButton: minusBtnData,
            plusButton: plusBtnData
        };

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(minusBtnData.x, minusBtnData.y, minusBtnData.width, minusBtnData.height);
        ctx.strokeRect(plusBtnData.x, plusBtnData.y, plusBtnData.width, plusBtnData.height);

        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("-", minusBtnData.x + btnSize / 2, minusBtnData.y + btnSize / 2);
        ctx.fillText("+", plusBtnData.x + btnSize / 2, plusBtnData.y + btnSize / 2);
        ctx.textBaseline = 'alphabetic';
    });


    // --- Action Buttons ---
    const buttonWidth = 250;
    const buttonHeight = 60;
    const actionButtonGap = 20;
    const buttons = [
        { id: 'resume', text: 'Resume' },
        { id: 'restart', text: 'Restart' },
        { id: 'exit', text: 'Back to Menu' }
    ];
    let startY = centerY + 180;

    buttons.forEach((btnInfo, index) => {
        const btnY = startY + index * (buttonHeight + actionButtonGap);
        const btnX = centerX - buttonWidth / 2;

        settingsMenu.buttons[btnInfo.id] = { x: btnX, y: btnY, width: buttonWidth, height: buttonHeight };

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(btnX, btnY, buttonWidth, buttonHeight);
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(btnInfo.text, centerX, btnY + 40);
    });
};

const drawGameHUD = () => {
  // Draw Pause Button
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  // Two vertical bars for the pause icon
  ctx.strokeRect(pauseButton.x + 8, pauseButton.y + 8, 8, 24);
  ctx.strokeRect(pauseButton.x + 24, pauseButton.y + 8, 8, 24);

  if (audioElement.value && audioElement.value.duration) {
    const progress = audioElement.value.currentTime / audioElement.value.duration;
    const progressBarWidth = progress * gameCanvas.value.width;
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.fillRect(0, 0, progressBarWidth, 5);
  }
  judgementLine.draw();
  noteManager.draw();
  effectManager.draw(ctx);
  if (scoreManager) {
    const score = scoreManager.getScore();
    const scoreDigitSize = 4;
    const scoreWidth = 7 * (3 * scoreDigitSize + scoreDigitSize);
    drawStylizedNumber(score, gameCanvas.value.width - scoreWidth - 20, 20, scoreDigitSize, 'white');
    const combo = scoreManager.getCombo();
    if (combo > 1) {
      const comboStr = String(combo);
      const comboDigitSize = 8;
      const comboWidth = comboStr.length * (3 * comboDigitSize + comboDigitSize);
      const comboX = (gameCanvas.value.width - comboWidth) / 2;
      const comboY = (gameCanvas.value.height - (5 * comboDigitSize)) / 2;
      drawStylizedNumber(combo, comboX, comboY, comboDigitSize, 'rgba(0, 255, 255, 0.8)');
    }
  }
};

const NUMBER_TEMPLATES = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,1,0],[0,1,0],[0,1,0]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
};

const drawStylizedNumber = (number, x, y, size, color) => {
  const numberStr = String(number).padStart(7, '0');
  const digitWidth = 3 * size;
  const digitSpacing = size;
  let currentX = x;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 1.5;
  for (const digit of numberStr) {
    const template = NUMBER_TEMPLATES[digit];
    if (template) {
      for (let row = 0; row < template.length; row++) {
        for (let col = 0; col < template[row].length; col++) {
          if (template[row][col] === 1) {
            ctx.fillRect(currentX + col * size, y + row * size, size, size);
          }
        }
      }
    }
    currentX += digitWidth + digitSpacing;
  }
};

const gameLoop = () => {
  update();
  draw();
  requestAnimationFrame(gameLoop);
};
</script>

<style scoped>
.game-container { position: relative; width: 100vw; height: 100vh; }
.game-canvas { display: block; background-color: #1a1a1a; }
</style>
