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

    // Store properties needed for time-based updates
    this.scrollTime = scrollTime;
    this.judgementLineY = judgementLineY;
    this.y = 0; // Initial y will be calculated in update

    this.isMissed = false;
    this.fadeDuration = 20; // frames
    this.fadeTimer = 0;
  }

  markAsMissed() {
    if (!this.isMissed) {
      this.isMissed = true;
      this.fadeTimer = this.fadeDuration;
    }
  }

  update(gameTime) {
    if (this.isMissed) {
      if (this.fadeTimer > 0) {
        this.fadeTimer--;
      }
    } else {
      // Time-based position calculation
      const timeUntilHit = this.time - gameTime;
      // Progress: 0 when note is spawning, 1 when note should be at the judgement line
      const progress = 1 - (timeUntilHit / this.scrollTime);

      // Notes start appearing from the top (y=0)
      this.y = this.judgementLineY * progress;
    }
  }

  isAlive() {
    return !this.isMissed || this.fadeTimer > 0;
  }

  draw() {
    throw new Error("Draw method must be implemented by subclass");
  }
}
