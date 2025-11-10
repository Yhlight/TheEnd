// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.approachAnimationProgress = 0;
    this.approachThreshold = 200;
  }

  update() {
    super.update();
    if (!this.isMissed) {
      const distance = -this.y;
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
