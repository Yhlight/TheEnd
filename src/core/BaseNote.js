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

    // Movement properties are now calculated in a separate method
    // to allow for dynamic speed changes.
    this.recalculateSpeed(scrollTime, judgementLineY);

    // y starts at the spawn position and moves towards the judgement line (y=0)
    // We calculate the initial y based on the speed and time it needs to travel.
    const timeToFall = scrollTime / 1000;
    this.y = -(this.speed * 60 * timeToFall);


    // State properties
    this.isMissed = false;
    this.fadeDuration = 20;
    this.fadeTimer = 0;
  }

  recalculateSpeed(scrollTime, judgementLineY) {
    const timeToFall = scrollTime / 1000; // in seconds
    // Use the initial judgement line position as a stable reference for distance
    const pixelsPerSecond = judgementLineY / timeToFall;
    this.speed = pixelsPerSecond / 60; // speed per frame, assuming 60fps
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
