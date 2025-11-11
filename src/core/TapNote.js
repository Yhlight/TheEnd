// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.judgementLineY = judgementLineY; // Store this for distance calculation
    this.approachAnimationProgress = 0;
    this.approachThreshold = 200;
  }

  update(gameTime) {
    super.update(gameTime); // This now correctly updates this.y based on time
    if (!this.isMissed) {
      // Approach animation is based on distance to judgement line, which is now derived from time
      const distance = this.judgementLineY - this.y;
      if (distance < this.approachThreshold && distance > 0) {
        this.approachAnimationProgress = 1 - (distance / this.approachThreshold);
      } else {
        this.approachAnimationProgress = 0;
      }
    }
  }

  draw(ctx, judgementLineX) {
    if (this.fadeTimer > 0 && this.isMissed) {
      ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }
    ctx.save();
    const renderX = this.x - judgementLineX;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 3;
    ctx.fillRect(renderX - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.shadowBlur = 0;
    if (!this.isMissed && this.approachAnimationProgress > 0) {
      const innerWidth = this.width * (1 - this.approachAnimationProgress);
      const innerHeight = this.height * (1 - this.approachAnimationProgress);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(renderX - innerWidth / 2, this.y - innerHeight / 2, innerWidth, innerHeight);
    }
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
