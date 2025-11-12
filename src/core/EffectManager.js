// src/core/EffectManager.js
import { Particle } from './Particle.js';
import { JudgementText } from './JudgementText.js';
import { Shockwave } from './Shockwave.js';

export class EffectManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.particles = [];
    this.judgementTexts = [];
    this.shockwaves = [];
  }

  createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  createJudgementText(x, y, text, color) {
    this.judgementTexts.push(new JudgementText(x, y, text, color));
  }

  createShockwave(x, y, color) {
    this.shockwaves.push(new Shockwave(x, y, color));
  }

  createComboMilestoneEffect(combo) {
      if (!this.canvas) return;
      const x = this.canvas.width / 2;
      const y = this.canvas.height / 2;
      const text = `${combo}`;
      const color = 'gold';
      this.judgementTexts.push(new JudgementText(x, y, text, color, 1.5, 1.5));
  }

  update() {
    for (const particle of this.particles) {
      particle.update();
    }
    this.particles = this.particles.filter(p => p.isAlive());

    for (const text of this.judgementTexts) {
      text.update(1/60);
    }
    this.judgementTexts = this.judgementTexts.filter(t => t.isAlive());

    for (const wave of this.shockwaves) {
        wave.update();
    }
    this.shockwaves = this.shockwaves.filter(s => s.isAlive());
  }

  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
    for (const text of this.judgementTexts) {
      text.draw(ctx);
    }
    for (const wave of this.shockwaves) {
        wave.draw(ctx);
    }
  }
}
