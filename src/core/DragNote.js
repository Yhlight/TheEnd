// src/core/DragNote.js
import { BaseNote } from './BaseNote.js';

export class DragNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.path = noteData.path;
    this.duration = noteData.duration;
    this.isBeingHeld = false;
    this.color = '#00FFFF'; // Cyan color for drag notes
  }

  update(gameTime) {
    super.update(gameTime);

    // --- Path-based movement ---
    const timeInNote = gameTime - this.time;
    if (timeInNote < 0) return;

    let startPoint = this.path[0];
    let endPoint = null;
    for (let i = 1; i < this.path.length; i++) {
      if (this.path[i][0] >= timeInNote) {
        endPoint = this.path[i];
        break;
      }
      startPoint = this.path[i];
    }

    if (!endPoint) {
      this.noteData.x = this.path[this.path.length - 1][1];
    } else {
      const [startTime, startX] = startPoint;
      const [endTime, endX] = endPoint;
      // Handle division by zero if startTime and endTime are the same
      const timeRatio = (endTime - startTime) === 0 ? 1 : (timeInNote - startTime) / (endTime - startTime);
      this.noteData.x = startX + (endX - startX) * timeRatio;
    }
  }

  draw(ctx, judgementLineX) {
    const renderX = this.x;
    const timeToFall = this.scrollTime;
    const pixelsPerMs = (this.canvas.height * 0.8) / timeToFall;

    // --- Draw the trajectory line ---
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();

    // Calculate the screen position for the first path point
    const firstPathTime = this.time + this.path[0][0];
    const firstY = this.y + (this.time - firstPathTime) * pixelsPerMs;
    const firstX = this.path[0][1] * this.canvas.width;
    ctx.moveTo(firstX - judgementLineX, firstY);

    // Draw lines to subsequent path points
    for (let i = 1; i < this.path.length; i++) {
      const pathTime = this.time + this.path[i][0];
      const pathY = this.y + (this.time - pathTime) * pixelsPerMs;
      const pathX = this.path[i][1] * this.canvas.width;
      ctx.lineTo(pathX - judgementLineX, pathY);
    }
    ctx.stroke();
    ctx.restore();


    // --- Draw the diamond-shaped note head ---
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(renderX - judgementLineX, this.y - this.height / 2); // Top point
    ctx.lineTo(renderX - judgementLineX + this.width / 2, this.y); // Right point
    ctx.lineTo(renderX - judgementLineX, this.y + this.height / 2); // Bottom point
    ctx.lineTo(renderX - judgementLineX - this.width / 2, this.y); // Left point
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
