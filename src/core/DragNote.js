// src/core/DragNote.js
import { BaseNote } from './BaseNote.js';

const lerp = (start, end, progress) => start + (end - start) * progress;

export class DragNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    const initialX = noteData.path[0][1];
    super(canvas, initialX * canvas.width, judgementLineY, scrollTime, noteData);

    this.path = noteData.path;
    this.duration = this.path[this.path.length - 1][0];
    this.color = '#00FFFF'; // Cyan
    this.isBeingHeld = false;

    // The initial Y position when the note is spawned
    this.spawnY = this.y;
  }

  update(gameTime) {
    super.update(); // Updates this.y

    const noteTime = gameTime - this.time;
    if (noteTime < 0) return;

    let startPoint = this.path[0];
    let endPoint = this.path[this.path.length - 1];
    for (let i = 0; i < this.path.length - 1; i++) {
      if (noteTime >= this.path[i][0] && noteTime <= this.path[i+1][0]) {
        startPoint = this.path[i];
        endPoint = this.path[i+1];
        break;
      }
    }

    const segmentDuration = endPoint[0] - startPoint[0];
    const timeIntoSegment = noteTime - startPoint[0];
    const progress = segmentDuration > 0 ? timeIntoSegment / segmentDuration : 1;

    const normalizedX = lerp(startPoint[1], endPoint[1], progress);
    this.x = normalizedX * this.canvas.width;
  }

  draw(ctx, judgementLineX) {
    if (this.fadeTimer > 0 && this.isMissed) {
      ctx.globalAlpha = this.fadeTimer / this.fadeDuration;
    }

    ctx.save();
    const renderX = this.x - judgementLineX;

    // --- Draw the path trail ---
    // The trail shows where the note will go. Its Y position is based on the note's fall progress.
    const fallProgress = this.y / this.spawnY;

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(renderX, this.y);

    // Iterate through future path segments to draw the trail
    for (const point of this.path) {
        const pointX = (point[1] * this.canvas.width) - judgementLineX;
        // Calculate the Y for this path point based on fall progress
        const pointY = this.y + (point[0] / this.duration) * (0 - this.y) * fallProgress;
        ctx.lineTo(pointX, pointY);
    }
    ctx.stroke();

    // --- Draw the note head as a diamond ---
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(renderX, this.y - this.height / 2 - 5); // Top point
    ctx.lineTo(renderX + this.width / 2, this.y);   // Right point
    ctx.lineTo(renderX, this.y + this.height / 2 + 5); // Bottom point
    ctx.lineTo(renderX - this.width / 2, this.y);   // Left point
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
