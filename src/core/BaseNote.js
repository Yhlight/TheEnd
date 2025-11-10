// src/core/BaseNote.js

export class BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Core properties
    this.x = x;
    this.y = 0;
    this.type = noteData.type;
    this.time = noteData.time;

    // Visual properties
    this.width = 100;
    this.height = 30;
    this.color = '#FFFFFF';

    // Movement properties
    const distance = judgementLineY;
    const timeInSeconds = scrollTime / 1000;
    const frames = timeInSeconds * 60; // Assuming 60 FPS
    this.speed = distance / frames;

    // State properties
    this.isMissed = false;
    this.fadeDuration = 20;
    this.fadeTimer = 0;
  }

  markAsMissed() {
    if (!this.isMissed) {
      this.isMissed = true;
      this.fadeTimer = this.fadeDuration;
    }
  }

  update() {
    if (this.isMissed) {
      if (this.fadeTimer > 0) {
        this.fadeTimer--;
      }
    } else {
      this.y += this.speed;
    }
  }

  isAlive() {
    return !this.isMissed || this.fadeTimer > 0;
  }

  draw() {
    // This method should be overridden by subclasses
    throw new Error("Draw method must be implemented by subclass");
  }
}
