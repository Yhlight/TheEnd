
// src/core/CatchNote.js
import { BaseNote } from './BaseNote.js';

export class CatchNote extends BaseNote {
  constructor(noteData) {
    super(noteData);
    this.duration = noteData.duration;
    this.type = 'catch';
    this.color = '#FFFF80'; // A yellow color for catch notes
  }

  draw(ctx, judgementLine) {
    if (this.judged) return;

    const timeUntilJudgement = this.time - judgementLine.gameTime;
    if (timeUntilJudgement > judgementLine.scrollTime) return;

    const headY = judgementLine.getYPosition(this.time);
    const tailY = judgementLine.getYPosition(this.time + this.duration);

    const renderX = judgementLine.x + (this.x - 0.5) * judgementLine.canvas.width;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Draw the main body of the catch note
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha * 0.5;
    ctx.fillRect(renderX - this.width / 2, tailY, this.width, headY - tailY);

    // Draw the head of the catch note
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(renderX - this.width / 2, headY - this.height / 2, this.width, this.height);

    ctx.restore();
  }
}
