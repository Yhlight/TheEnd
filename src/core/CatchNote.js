
// src/core/CatchNote.js
import { BaseNote } from './BaseNote.js';

export class CatchNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier) {
    super(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier);
    this.duration = noteData.duration;
    this.type = 'catch';
    this.color = '#FFFF80'; // A yellow color for catch notes
  }

  draw(ctx, judgementLineX) {
    if (this.isMissed) return;

    const headY = this.y;
    const tailY = this.y - (this.duration / this.scrollTime) * this.judgementLineY;

    const renderX = judgementLineX + (this.x - 0.5) * this.canvas.width;
    const scaledWidth = this.width * this.scale;
    const scaledHeight = this.height * this.scale;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Draw the main body of the catch note
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha * 0.5;
    ctx.fillRect(renderX - scaledWidth / 2, tailY, scaledWidth, headY - tailY);

    // Draw the head of the catch note
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(renderX - scaledWidth / 2, headY - scaledHeight / 2, scaledWidth, scaledHeight);

    ctx.restore();
  }
}
