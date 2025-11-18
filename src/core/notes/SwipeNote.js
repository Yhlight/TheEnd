// src/core/notes/SwipeNote.js
import { BaseNote } from './BaseNote.js';

export class SwipeNote extends BaseNote {
  constructor(noteData) {
    super(noteData);
    this.size = 60; // Slightly larger than a tap note
  }

  draw(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.renderX, this.renderY);
    ctx.scale(this.scale, this.scale);

    const color = '#00FFFF';
    this.applyGlow(ctx, color);
    ctx.fillStyle = color; // Cyan color for swipe
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;

    // Draw an arrow shape
    ctx.beginPath();
    ctx.moveTo(0, -this.size / 2);
    ctx.lineTo(this.size / 2, 0);
    ctx.lineTo(this.size / 4, 0);
    ctx.lineTo(this.size / 4, this.size / 2);
    ctx.lineTo(-this.size / 4, this.size / 2);
    ctx.lineTo(-this.size / 4, 0);
    ctx.lineTo(-this.size / 2, 0);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
