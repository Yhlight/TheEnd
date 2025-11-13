// src/core/HoldNote.js
import { BaseNote } from './BaseNote.js';

export class HoldNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.duration = noteData.duration;
    this.color = '#80FFFF'; // A cyan color for hold notes
  }

  getHeadY(gameTime) {
    const timeUntilJudgement = this.time - gameTime;
    const progress = 1 - (timeUntilJudgement / this.scrollTime);
    return progress * this.judgementLineY;
  }

  getTailY(gameTime) {
    const endTime = this.time + this.duration;
    const timeUntilJudgement = endTime - gameTime;
    const progress = 1 - (timeUntilJudgement / this.scrollTime);
    return progress * this.judgementLineY;
  }

  draw(ctx, judgementLineX) {
    if (!this.isAlive()) return;

    const headY = this.getHeadY(this.y / this.judgementLineY * this.scrollTime + (this.time - this.scrollTime));
    const tailY = this.getTailY(this.y / this.judgementLineY * this.scrollTime + (this.time - this.scrollTime));
    const renderX = judgementLineX + (this.x - 0.5) * this.canvas.width;
    const scaledWidth = this.width * this.scale;
    const scaledHeight = this.height * this.scale;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Draw the main body of the hold note
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha * 0.5;
    ctx.fillRect(renderX - scaledWidth / 2, tailY, scaledWidth, headY - tailY);

    // Draw the head of the hold note
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(renderX - scaledWidth / 2, headY - scaledHeight / 2, scaledWidth, scaledHeight);

    ctx.restore();
  }
}
