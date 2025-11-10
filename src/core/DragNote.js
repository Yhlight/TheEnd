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

    const fallProgress = this.y / this.spawnY;

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(renderX, this.y);

    for (const point of this.path) {
        const pointX = (point[1] * this.canvas.width) - judgementLineX;
        const pointY = this.y + (point[0] / this.duration) * (0 - this.y) * fallProgress;
        ctx.lineTo(pointX, pointY);
    }
    ctx.stroke();

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(renderX, this.y - this.height / 2 - 5);
    ctx.lineTo(renderX + this.width / 2, this.y);
    ctx.lineTo(renderX, this.y + this.height / 2 + 5);
    ctx.lineTo(renderX - this.width / 2, this.y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
