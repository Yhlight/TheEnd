// src/core/HoldNote.js
import { BaseNote } from './BaseNote.js';

export class HoldNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);

    this.duration = noteData.duration;

    // Calculate the length of the hold note in pixels based on its duration
    const timeToFall = scrollTime / 1000; // in seconds
    const pixelsPerSecond = (judgementLineY) / timeToFall;
    this.noteLength = (this.duration / 1000) * pixelsPerSecond;
  }

  update(judgementLineY) {
    // A hold note's logic is more complex and will be handled
    // largely by the NoteManager. For now, basic movement is enough.
    super.update();
  }

  draw() {
    if (this.fadeTimer > 0 && this.isMissed) {
      this.ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }

    this.ctx.save();

    const startX = this.x - this.width / 2;
    const startY = this.y - this.height / 2;

    // Draw the main body of the hold note
    const bodyHeight = this.noteLength;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent body
    this.ctx.fillRect(startX, startY - bodyHeight, this.width, bodyHeight);

    // Draw the start and end lines with subtle glow
    this.ctx.fillStyle = this.color;
    this.ctx.shadowColor = this.color;
    this.ctx.shadowBlur = 5;

    // Start line (this is the part that gets judged)
    this.ctx.fillRect(startX, startY, this.width, this.height);

    // End line
    this.ctx.fillRect(startX, startY - bodyHeight, this.width, this.height);

    this.ctx.shadowBlur = 0; // Reset shadow
    this.ctx.restore();

    // Reset global alpha
    this.ctx.globalAlpha = 1.0;
  }
}
