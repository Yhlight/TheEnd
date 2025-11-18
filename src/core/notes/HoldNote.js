// src/core/notes/HoldNote.js
import { BaseNote } from './BaseNote.js';

export class HoldNote extends BaseNote {
  constructor(noteData) {
    super(noteData);
    this.duration = noteData.duration; // in ms
    this.endTime = this.time + this.duration;

    this.isBeingHeld = false;
    this.holdProgress = 0; // 0 to 1

    this.headSize = 50;
    this.tailSize = 50;
    this.beamWidth = 40;
  }

  update(gameTime, noteSpeed) {
    super.update(gameTime, noteSpeed);

    // Calculate the end position of the hold note
    const timeUntilEnd = this.endTime - gameTime;
    this.endRenderY = -timeUntilEnd * noteSpeed;

    // Update hold progress if being held
    if (this.isBeingHeld) {
      this.holdProgress = (gameTime - this.time) / this.duration;
      if (this.holdProgress > 1) {
        this.holdProgress = 1;
        this.isBeingHeld = false; // The hold is complete
      }
    }
  }

  draw(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.renderX, 0); // Translate only on X, Y is handled in drawing

    const startY = this.renderY;
    const endY = this.endRenderY;

    // --- Draw the connecting beam ---
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2;

    // Draw the "un-hit" part of the beam
    const unhitStartY = Math.max(startY, startY + (endY - startY) * this.holdProgress);
    ctx.fillRect(-this.beamWidth / 2, unhitStartY, this.beamWidth, endY - unhitStartY);

    // Draw the "hit" part of the beam (brighter)
    if (this.holdProgress > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(-this.beamWidth / 2, startY, this.beamWidth, (endY - startY) * this.holdProgress);
    }

    // --- Draw the hold head (diamond shape) ---
    if (this.holdProgress < 1) { // Hide head once passed
      ctx.save();
      ctx.translate(0, this.renderY);
      ctx.scale(this.scale, this.scale);

      ctx.fillStyle = '#FFFF00'; // Yellow
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(0, -this.headSize / 2);
      ctx.lineTo(this.headSize / 2, 0);
      ctx.lineTo(0, this.headSize / 2);
      ctx.lineTo(-this.headSize / 2, 0);
      ctx.closePath();

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}
