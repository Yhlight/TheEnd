// src/core/JudgementText.js

import { Easing } from './Easing.js';

export class JudgementText {
  constructor(x, y, text, color, sizeMultiplier = 1.0, durationMultiplier = 1.0, isMilestone = false) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.isMilestone = isMilestone;
    this.maxLife = 1.0 * durationMultiplier;
    this.life = this.maxLife;
    this.decayRate = 1.5 / durationMultiplier;
    this.baseSize = isMilestone ? 60 : 30 * sizeMultiplier;
    this.scale = isMilestone ? 2.5 : 1.5; // Start bigger for milestones
  }

  update(deltaTime) {
    this.life -= this.decayRate * deltaTime;

    if (this.isMilestone) {
      // "Pop" animation for milestones
      const progress = 1 - (this.life / this.maxLife);
      this.scale = 2.5 - 1.5 * Easing.easeOutCubic(progress);
    } else {
      // Standard animation for judgements
      this.scale = 1.0 + (this.life * 0.5);
      this.y -= 30 * deltaTime;
    }
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
