// src/core/FlickNote.js
import { TapNote } from './TapNote.js';

export class FlickNote extends TapNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.color = '#FFFF80'; // A yellowish color for flick notes
  }

  draw(ctx, judgementLineX) {
    if (!this.isAlive()) return;

    const renderX = judgementLineX + this.x * (this.canvas.width / 2);
    const scaledWidth = this.width * this.scale * 0.8;
    const scaledHeight = this.height * this.scale * 1.5;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.moveTo(renderX - scaledWidth / 2, this.y + scaledHeight / 4);
    ctx.lineTo(renderX, this.y - scaledHeight / 4);
    ctx.lineTo(renderX + scaledWidth / 2, this.y + scaledHeight / 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
