// src/core/BaseNote.js

export class BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Core properties
    this.x = x;
    this.type = noteData.type;
    this.time = noteData.time;

    // Visual properties
    this.width = 100;
    this.height = 30;
    this.color = '#FFFFFF';

    // Movement properties
    // y is now the distance to the judgement line.
    // It starts at a negative value and moves towards 0.
    const timeToFall = scrollTime / 1000; // in seconds
    const pixelsPerSecond = (judgementLineY) / timeToFall; // Use judgementLineY as a reference for distance

    this.y = -pixelsPerSecond * timeToFall;
    this.speed = pixelsPerSecond / 60; // speed per frame, assuming 60fps

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
