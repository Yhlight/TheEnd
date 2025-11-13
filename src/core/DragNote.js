// src/core/DragNote.js
import { BaseNote } from './BaseNote.js';
import { Easing } from './Easing.js';

export class DragNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData) {
    super(canvas, x, judgementLineY, scrollTime, noteData);
    this.path = noteData.path;
    this.duration = noteData.duration;
    this.color = '#80FFFF'; // A cyan color for drag notes
    this.width = 40;
    this.height = 40;
  }

  update(gameTime) {
    super.update(gameTime);

    const timeInNote = gameTime - this.time;
    if (timeInNote < 0) {
        this.x = this.path[0][1];
        return;
    };

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
      this.x = this.path[this.path.length - 1][1];
    } else {
      const [startTime, startX] = startPoint;
      const [endTime, endX] = endPoint;
      const timeRatio = (timeInNote - startTime) / (endTime - startTime);
      this.x = startX + (endX - startX) * Easing.linear(timeRatio);
    }
  }

  draw(ctx, judgementLineX) {
    if (!this.isAlive()) return;

    const renderX = judgementLineX + (this.x - 0.5) * this.canvas.width;
    const scaledWidth = this.width * this.scale;
    const scaledHeight = this.height * this.scale;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.moveTo(renderX, this.y - scaledHeight / 2);
    ctx.lineTo(renderX + scaledWidth / 2, this.y);
    ctx.lineTo(renderX, this.y + scaledHeight / 2);
    ctx.lineTo(renderX - scaledWidth / 2, this.y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
