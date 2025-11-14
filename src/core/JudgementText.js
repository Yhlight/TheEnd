// src/core/JudgementText.js

import { Easing } from './Easing.js';

export class JudgementText {
  constructor(x, y, text, color, sizeMultiplier = 1.0, durationMultiplier = 1.0, isMilestone = false) {
    this.x = x;
    this.y = y;
    this.drawX = x; // Position for drawing, includes shake
    this.drawY = y;
    this.text = text;
    this.color = color;
    this.isMilestone = isMilestone;
    this.maxLife = 1.2 * durationMultiplier; // Slightly longer life for milestones
    this.life = this.maxLife;
    this.decayRate = 1.5 / durationMultiplier;
    this.baseSize = isMilestone ? 70 : 30 * sizeMultiplier;
    this.scale = isMilestone ? 3.0 : 1.5; // Start bigger for milestones
  }

  update(deltaTime) {
    this.life -= this.decayRate * deltaTime;

    if (this.isMilestone) {
      const progress = 1 - (this.life / this.maxLife);
      this.scale = 3.0 - 2.0 * Easing.easeOutElastic(progress); // More bouncy animation

      // Add shake effect
      const shakeIntensity = Math.max(0, 1 - progress * 2) * 5;
      this.drawX = this.x + (Math.random() - 0.5) * shakeIntensity;
      this.drawY = this.y + (Math.random() - 0.5) * shakeIntensity;
    } else {
      // Standard animation for judgements
      this.scale = 1.0 + (this.life * 0.5);
      this.y -= 30 * deltaTime;
      this.drawX = this.x;
      this.drawY = this.y;
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
    ctx.fillText(this.text, this.drawX, this.drawY);
    ctx.restore();
  }
}
