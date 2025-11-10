// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);

    // TapNote specific properties
    this.approachAnimationProgress = 0;
    this.approachThreshold = 200; // Start animation when 200px away
  }

  update() {
    // Call parent update for basic movement
    super.update();

    // Update approach animation based on new coordinate system
    if (!this.isMissed) {
      const distance = -this.y; // y is negative, so -y is the positive distance
      if (distance < this.approachThreshold) {
        this.approachAnimationProgress = 1 - (distance / this.approachThreshold);
      }
    }
  }

  draw(ctx, judgementLineX) {
    if (this.fadeTimer > 0 && this.isMissed) {
      ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }

    ctx.save();

    // The canvas is translated to the judgement line's position.
    // We need to render the note relative to that origin.
    const renderX = this.x - judgementLineX;

    // Draw base note with a very subtle glow
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 3;
    ctx.fillRect(renderX - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.shadowBlur = 0;

    // Draw approach animation overlay (as a wireframe)
    if (!this.isMissed && this.approachAnimationProgress > 0) {
      const innerWidth = this.width * (1 - this.approachAnimationProgress);
      const innerHeight = this.height * (1 - this.approachAnimationProgress);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        renderX - innerWidth / 2,
        this.y - innerHeight / 2,
        innerWidth,
        innerHeight
      );
    }

    ctx.restore();

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  }
}
