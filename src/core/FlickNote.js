// src/core/FlickNote.js
import { TapNote } from './TapNote.js';

export class FlickNote extends TapNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);

    // FlickNotes are yellow
    this.color = '#FFFF00';
  }

  draw(ctx, judgementLineX) {
    // First, draw the base note using the parent's draw method
    super.draw(ctx, judgementLineX);

    // Now, draw the flick indicator on top of it
    ctx.save();

    const renderX = this.x - judgementLineX;
    const renderY = this.y;

    // The indicator is a simple "V" shape or chevron
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(renderX - this.width / 4, renderY - this.height / 3);
    ctx.lineTo(renderX, renderY - this.height * 0.8);
    ctx.lineTo(renderX + this.width / 4, renderY - this.height / 3);
    ctx.stroke();

    ctx.restore();
  }
}
