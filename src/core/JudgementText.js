// src/core/JudgementText.js

export class JudgementText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;

    this.life = 1.0; // Lives for 1.0 arbitrary units of time
    this.decayRate = 1.5; // Controls how fast it fades and shrinks

    this.scale = 1.5; // Initial scale
  }

  update(deltaTime) {
    this.life -= this.decayRate * deltaTime;
    this.scale = 1.0 + (this.life * 0.5); // Start big and shrink to normal size
    this.y -= 30 * deltaTime; // Move upwards slightly
  }

  isAlive() {
    return this.life > 0;
  }

  draw(ctx) {
    if (!this.isAlive()) return;

    ctx.save();

    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.font = `bold ${30 * this.scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;

    ctx.fillText(this.text, this.x, this.y);

    ctx.restore();
  }
}
