// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.color = '#FF8080'; // A reddish color for tap notes
    this.width = 120;
    this.height = 25;
  }

  draw(ctx, judgementLineX) {
    if (!this.isAlive()) return;

    const renderX = judgementLineX + this.x * (this.canvas.width / 2);
    const scaledWidth = this.width * this.scale;
    const scaledHeight = this.height * this.scale;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(renderX - scaledWidth / 2, this.y - scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.restore();
  }
}
