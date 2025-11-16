// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier) {
    super(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier);
    this.color = '#FF8080'; // A reddish color for tap notes
    this.baseWidth = 120;
    this.baseHeight = 25;
    this.setSizeMultiplier(sizeMultiplier || 1);
  }

  draw(ctx, judgementLineX) {
    if (!this.isAlive()) return;

    const renderX = (this.canvas.width / 2) + judgementLineX + (this.x - 0.5) * this.canvas.width;
    const scaledWidth = this.width * this.scale;
    const scaledHeight = this.height * this.scale;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(renderX - scaledWidth / 2, this.y - scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.restore();
  }
}
