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
  }

  update(gameTime) {
    // Check for new events to trigger
    if (this.nextEventIndex < this.events.length && gameTime >= this.events[this.nextEventIndex].time) {
      this.activeEvent = this.events[this.nextEventIndex];
      this.nextEventIndex++;

      // Store the current state as the base for interpolation
      this.baseState = { x: this.x, y: this.y, rotation: this.rotation, alpha: this.alpha };

      // Set the target state from the event, providing defaults
      this.targetState = {
        x: this.activeEvent.value.x ?? this.x,
        y: (this.activeEvent.value.y !== undefined) ? this.defaultY + this.activeEvent.value.y : this.y,
        rotation: this.activeEvent.value.rotation ?? this.rotation,
        alpha: this.activeEvent.value.alpha ?? this.alpha,
      };

      this.activeEvent.startTime = this.activeEvent.time;
      this.activeEvent.endTime = this.activeEvent.time + this.activeEvent.duration;
    }

    // Update state based on the active event
    if (this.activeEvent) {
      const now = gameTime;
      const { startTime, endTime, duration, easing } = this.activeEvent;

      let progress = 0;
      if (duration > 0) {
        progress = (now - startTime) / duration;
      }
      progress = Math.max(0, Math.min(1, progress)); // Clamp progress between 0 and 1

      const easingFunction = Easing[easing] || Easing.linear;
      const easedProgress = easingFunction(progress);

      // Interpolate all properties
      for (const key in this.targetState) {
        const start = this.baseState[key];
        const end = this.targetState[key];
        this[key] = start + (end - start) * easedProgress;
      }

      // If the event has finished, deactivate it
      if (now >= endTime) {
        this.activeEvent = null;
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const shockwave = this.shockwaves[i];
      shockwave.progress += 1 / this.shockwaveDuration;
      if (shockwave.progress >= 1) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update flash effect
    if (this.flashIntensity > 0) {
      this.flashIntensity -= 0.05; // Decay rate
    }
    this.flashIntensity = Math.max(0, this.flashIntensity);
  }

  flash(color = '#FFFFFF') {
    this.shockwaves.push({ progress: 0, color: color });
    this.flashIntensity = 1.0;
    this.flashColor = color;
  }

  draw() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.y;

    ctx.save();

    // Apply transformations
    ctx.globalAlpha = this.alpha;
    ctx.translate(centerX + this.x, centerY);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    // Draw the base judgement line
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    ctx.lineTo(this.canvas.width, this.y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;

    // Dynamic Glow Effect
    const baseBlur = 10;
    const pulsingBlur = Math.sin(performance.now() * 0.002) * 2 + 2; // Pulsates between 0 and 4
    const flashBlur = this.flashIntensity * 25; // Intense blur on flash
    ctx.shadowBlur = baseBlur + pulsingBlur + flashBlur;

    // Mix flash color with base color
    const flashR = parseInt(this.flashColor.slice(1, 3), 16);
    const flashG = parseInt(this.flashColor.slice(3, 5), 16);
    const flashB = parseInt(this.flashColor.slice(5, 7), 16);
    const baseR = 0;
    const baseG = 255;
    const baseB = 255;
    const r = Math.floor(baseR + (flashR - baseR) * this.flashIntensity);
    const g = Math.floor(baseG + (flashG - baseG) * this.flashIntensity);
    const b = Math.floor(baseB + (flashB - baseB) * this.flashIntensity);
    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;

    ctx.stroke();

    // Draw shockwaves (they will also be transformed)
    this.shockwaves.forEach(shockwave => {
      const easedProgress = Easing.easeOutCubic(shockwave.progress);
      const radius = easedProgress * 250; // Increased radius
      const alpha = 1 - easedProgress;
      const lineWidth = 8 * (1 - easedProgress); // Increased line width

      ctx.save();
      ctx.globalAlpha = alpha; // Local alpha for shockwave fade
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = shockwave.color;
      ctx.shadowColor = shockwave.color;
      ctx.shadowBlur = 25; // Increased shadow blur

      ctx.beginPath();
      // A single, more impactful wave expanding outwards
      ctx.moveTo(0, this.y - radius);
      ctx.lineTo(this.canvas.width, this.y - radius);
      ctx.moveTo(0, this.y + radius);
      ctx.lineTo(this.canvas.width, this.y + radius);
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore(); // Restore transform and global alpha
  }
}
