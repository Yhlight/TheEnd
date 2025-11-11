// src/core/FlickNote.js
import { TapNote } from './TapNote.js';

export class FlickNote extends TapNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    // Use a bright yellow color for flick notes
    this.color = '#FFFF00';
  }

  draw(ctx, judgementLineX) {
    // We don't call super.draw() anymore to create a unique appearance

    ctx.save();

    const renderX = this.x - judgementLineX;
    const renderY = this.y;
    const width = this.width * 1.2; // Make the chevron slightly larger
    const height = this.height * 1.2;

    // Set styling for the chevron
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 5; // Thicker line
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10; // More prominent glow

    // Draw a filled chevron shape
    ctx.beginPath();
    ctx.moveTo(renderX - width / 2, renderY + height / 4);
    ctx.lineTo(renderX, renderY - height / 2);
    ctx.lineTo(renderX + width / 2, renderY + height / 4);
    ctx.lineTo(renderX, renderY + height / 8); // Add a small point to the bottom
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
