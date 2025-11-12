// src/core/JudgementText.js

export class JudgementText {
  constructor(x, y, text, color, sizeMultiplier = 1.0, durationMultiplier = 1.0) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0 * durationMultiplier;
    this.decayRate = 1.5 / durationMultiplier;
    this.baseSize = 30 * sizeMultiplier;
    this.scale = 1.5;
  }

  update(deltaTime) {
    this.life -= this.decayRate * deltaTime;
    this.scale = 1.0 + (this.life * 0.5);
    this.y -= 30 * deltaTime;
  }

  isAlive() {
    return this.life > 0;
  }

  draw(ctx) {
    if (!this.isAlive()) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.baseSize * this.scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
