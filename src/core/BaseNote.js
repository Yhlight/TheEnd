// src/core/BaseNote.js

export class BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.x = x;
    this.type = noteData.type;
    this.time = noteData.time;
    this.width = 100;
    this.height = 30;
    this.color = '#FFFFFF';
    this.recalculateSpeed(scrollTime, judgementLineY);
    const timeToFall = scrollTime / 1000;
    this.y = -(this.speed * 60 * timeToFall);
    this.isMissed = false;
    this.fadeDuration = 20;
    this.fadeTimer = 0;
  }

  recalculateSpeed(scrollTime, judgementLineY) {
    const timeToFall = scrollTime / 1000;
    const pixelsPerSecond = judgementLineY / timeToFall;
    this.speed = pixelsPerSecond / 60;
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
    throw new Error("Draw method must be implemented by subclass");
  }
}
