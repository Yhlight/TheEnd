// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);

    // TapNote specific properties
    this.approachAnimationProgress = 0;
    this.approachThreshold = 200; // Start animation when 200px away
  }

  update(judgementLineY) {
    // Call parent update for basic movement and miss logic
    super.update();

    // Update approach animation
    if (!this.isMissed) {
      const distance = judgementLineY - this.y;
      if (distance > 0 && distance < this.approachThreshold) {
        this.approachAnimationProgress = 1 - (distance / this.approachThreshold);
      } else if (distance <= 0) {
        this.approachAnimationProgress = 1; // Animation complete
      }
    }
  }

  draw() {
    if (this.fadeTimer > 0 && this.isMissed) {
      this.ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }

    this.ctx.save();

    // Draw base note with a very subtle glow
    this.ctx.fillStyle = this.color;
    this.ctx.shadowColor = this.color;
    this.ctx.shadowBlur = 3; // Subtle glow
    this.ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    this.ctx.shadowBlur = 0; // Reset shadow

    // Draw approach animation overlay (as a wireframe)
    if (!this.isMissed && this.approachAnimationProgress > 0) {
      const innerWidth = this.width * (1 - this.approachAnimationProgress);
      const innerHeight = this.height * (1 - this.approachAnimationProgress);

      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Dark inner lines for contrast
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        this.x - innerWidth / 2,
        this.y - innerHeight / 2,
        innerWidth,
        innerHeight
      );
    }

    this.ctx.restore();

    // Reset global alpha
    this.ctx.globalAlpha = 1.0;
  }
}
