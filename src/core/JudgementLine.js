// src/core/JudgementLine.js
import { Easing } from './Easing.js';

export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.defaultY = this.canvas.height * 0.8;

    // Core state properties
    this.x = 0; // Represents horizontal offset
    this.y = this.defaultY;
    this.rotation = 0; // In degrees
    this.alpha = 1.0;
    this.color = '#FFFFFF';
    this.glow = 10;

    // Event management
    this.events = [];
    this.nextEventIndex = 0;
    this.activeEvent = null;

    // State for interpolation
    this.baseState = {};
    this.targetState = {};

    // Shockwave effect properties
    this.shockwaves = [];
    this.shockwaveDuration = 30; // frames

    // Flash effect properties
    this.flashIntensity = 0;
    this.flashColor = '#FFFFFF';
  }

  loadEvents(lineEvents) {
    this.events = lineEvents.sort((a, b) => a.time - b.time);
    this.nextEventIndex = 0;
    this.activeEvent = null;
    // Reset to default state
    this.x = 0;
    this.y = this.defaultY;
    this.rotation = 0;
    this.alpha = 1.0;
    this.color = '#FFFFFF';
    this.glow = 10;
  }

  // --- Color interpolation helpers ---
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  interpolateColor(color1, color2, factor) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1; // Fallback
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    return this.rgbToHex(r, g, b);
  }
  // ------------------------------------

  update(gameTime) {
    if (this.nextEventIndex < this.events.length && gameTime >= this.events[this.nextEventIndex].time) {
      this.activeEvent = this.events[this.nextEventIndex];
      this.nextEventIndex++;

      this.baseState = { x: this.x, y: this.y, rotation: this.rotation, alpha: this.alpha, color: this.color, glow: this.glow };

      this.targetState = {
        x: this.activeEvent.value.x ?? this.x,
        y: (this.activeEvent.value.y !== undefined) ? this.defaultY + this.activeEvent.value.y : this.y,
        rotation: this.activeEvent.value.rotation ?? this.rotation,
        alpha: this.activeEvent.value.alpha ?? this.alpha,
        color: this.activeEvent.value.color ?? this.color,
        glow: this.activeEvent.value.glow ?? this.glow,
      };

      this.activeEvent.startTime = this.activeEvent.time;
      this.activeEvent.endTime = this.activeEvent.time + this.activeEvent.duration;
    }

    if (this.activeEvent) {
      const now = gameTime;
      const { startTime, endTime, duration, easing } = this.activeEvent;

      let progress = duration > 0 ? (now - startTime) / duration : 1;
      progress = Math.max(0, Math.min(1, progress));

      const easingFunction = Easing[easing] || Easing.linear;
      const easedProgress = easingFunction(progress);

      for (const key in this.targetState) {
        if (key === 'color') {
          this.color = this.interpolateColor(this.baseState.color, this.targetState.color, easedProgress);
        } else {
          const start = this.baseState[key];
          const end = this.targetState[key];
          this[key] = start + (end - start) * easedProgress;
        }
      }

      if (now >= endTime) {
        this.activeEvent = null;
      }
    }
  }

  flash(gameTime, color = '#FFFFFF', duration = 150) {
    // Store the state before the flash, to return to it later.
    // This is crucial if a chart-driven event is already in progress.
    const returnState = {
        color: this.color,
        glow: this.glow,
    };

    // Create a flash-out event (brighten)
    const flashOutEvent = {
        time: gameTime,
        duration: duration / 2,
        value: { color: color, glow: 50 },
        easing: 'easeOutQuad',
        isFlash: true, // Custom flag to identify temporary events
    };

    // Create a flash-in event (return to original state)
    const flashInEvent = {
        time: gameTime + duration / 2,
        duration: duration / 2,
        value: returnState,
        easing: 'easeInQuad',
        isFlash: true,
    };

    // Remove any previous flash events to avoid conflicts
    this.events = this.events.filter(e => !e.isFlash);

    // Insert the new flash events at the correct position, sorted by time
    this.events.push(flashOutEvent, flashInEvent);
    this.events.sort((a, b) => a.time - b.time);

    // Find the correct nextEventIndex to ensure the new event is processed
    this.nextEventIndex = this.events.findIndex(e => e.time >= gameTime);
    this.activeEvent = null; // Force the update loop to re-evaluate for the new event
  }

  draw() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.y;

    ctx.save();

    ctx.globalAlpha = this.alpha;
    ctx.translate(centerX + this.x, centerY);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    ctx.beginPath();
    ctx.moveTo(0, this.y);
    ctx.lineTo(this.canvas.width, this.y);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = this.glow;
    ctx.shadowColor = this.color;

    ctx.stroke();

    ctx.restore();
  }
}
