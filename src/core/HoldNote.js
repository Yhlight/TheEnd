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

    // Animation properties for the energy flow effect
    this.flowAnimationTimer = Math.random() * Math.PI * 2;
    this.flowSpeed = 0.1;

    // State properties
    this.isBeingHeld = false;
  }

  update() {
    super.update();
    this.flowAnimationTimer += this.flowSpeed;
  }

  draw(ctx, judgementLineX) {
    if (this.fadeTimer > 0 && this.isMissed) {
      ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }

    ctx.save();

    // The canvas is translated to the judgement line's position.
    // We need to render the note relative to that origin.
    const renderX = this.x - judgementLineX;
    const startX = renderX - this.width / 2;
    const startY = this.y - this.height / 2;

    // Draw the main body of the hold note
    const bodyHeight = this.noteLength;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent body
    ctx.fillRect(startX, startY - bodyHeight, this.width, bodyHeight);

    // Draw the energy flow pulse
    const flowProgress = (Math.sin(this.flowAnimationTimer) + 1) / 2; // Normalize to 0-1 range
    const flowY = startY - (bodyHeight * flowProgress);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15;
    ctx.fillRect(startX, flowY - 5, this.width, 10); // A 10px tall pulse
    ctx.shadowBlur = 0; // Reset for the end lines

    // Draw the start and end lines with subtle glow
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;

    // Start line (this is the part that gets judged)
    ctx.fillRect(startX, startY, this.width, this.height);

    // End line
    ctx.fillRect(startX, startY - bodyHeight, this.width, this.height);

    ctx.shadowBlur = 0; // Reset shadow
    ctx.restore();

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  }
}
