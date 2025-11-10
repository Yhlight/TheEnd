// src/core/HoldNote.js
import { BaseNote } from './BaseNote.js';

export class HoldNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.duration = noteData.duration;
    const timeToFall = scrollTime / 1000;
    const pixelsPerSecond = judgementLineY / timeToFall;
    this.noteLength = (this.duration / 1000) * pixelsPerSecond;
    this.flowAnimationTimer = Math.random() * Math.PI * 2;
    this.flowSpeed = 0.1;
    this.isBeingHeld = false;
  }

  update() {
    super.update();
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
    const bodyHeight = this.noteLength;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(startX, startY - bodyHeight, this.width, bodyHeight);
    const flowProgress = (Math.sin(this.flowAnimationTimer) + 1) / 2;
    const flowY = startY - (bodyHeight * flowProgress);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15;
    ctx.fillRect(startX, flowY - 5, this.width, 10);
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.fillRect(startX, startY, this.width, this.height);
    ctx.fillRect(startX, startY - bodyHeight, this.width, this.height);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
