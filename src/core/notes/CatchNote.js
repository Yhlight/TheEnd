// src/core/notes/CatchNote.js
import { BaseNote } from './BaseNote.js';

export class CatchNote extends BaseNote {
  constructor(noteData) {
    super(noteData);
    this.width = 200; // The visual width of the bar
    this.height = 20;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.renderX, this.renderY);
    ctx.scale(this.scale, this.scale);

    ctx.fillStyle = 'rgba(255, 165, 0, 0.7)'; // Orange
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3;

    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.restore();
  }
}
