// src/core/HoldNote.js
import { BaseNote } from './BaseNote.js';

export class HoldNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.duration = noteData.duration;
    this.flowAnimationTimer = Math.random() * Math.PI * 2;
    this.flowSpeed = 0.1;
    this.isBeingHeld = false;
  }

  update(gameTime) {
    super.update(gameTime);
    this.flowAnimationTimer += this.flowSpeed;
  }

  draw(ctx, judgementLineX) {
    if (this.fadeTimer > 0 && this.isMissed) {
      ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }
    ctx.save();
    const renderX = this.x - judgementLineX;
    const startX = renderX - this.width / 2;
    const startY = this.y - this.height / 2;

    // Time-based calculation for note length
    const bodyHeight = (this.duration / this.scrollTime) * this.judgementLineY;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(startX, startY - bodyHeight, this.width, bodyHeight);

    // Flow animation should be contained within the note body
    if (this.isBeingHeld) {
        const flowProgress = (Math.sin(this.flowAnimationTimer) + 1) / 2;
        const flowY = startY - (bodyHeight * flowProgress);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 15;
        ctx.fillRect(startX, flowY - 5, this.width, 10);
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    // Draw head
    ctx.fillRect(startX, startY, this.width, this.height);
    // Draw tail
    ctx.fillRect(startX, startY - bodyHeight, this.width, this.height);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
