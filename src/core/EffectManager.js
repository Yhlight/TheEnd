// src/core/EffectManager.js
import { Particle } from './Particle.js';
import { JudgementText } from './JudgementText.js';
import { Shockwave } from './Shockwave.js';

export class EffectManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.particles = [];
    this.particlePool = [];
    this.judgementTexts = [];
    this.shockwaves = [];
  }

  createExplosion(x, y, color, judgement) {
    let count = 0;
    switch (judgement) {
      case 'Perfect':
        count = 30;
        break;
      case 'Good':
        count = 15;
        break;
      // No explosion for 'Miss' or 'Bad'
      default:
        count = 0;
        break;
    }

    for (let i = 0; i < count; i++) {
      let p = this.particlePool.pop();
      if (p) {
        p.reset(x, y, color);
      } else {
        p = new Particle(x, y, color);
      }
      this.particles.push(p);
    }
  }

  createJudgementText(x, y, text, color) {
    let sizeMultiplier = 1.0;
    let durationMultiplier = 1.0;

    switch (text) {
      case 'Perfect':
        sizeMultiplier = 1.2;
        durationMultiplier = 1.1;
        break;
      case 'Good':
        sizeMultiplier = 1.0;
        durationMultiplier = 1.0;
        break;
      case 'Miss':
        sizeMultiplier = 0.8;
        color = '#FF8080'; // Override color for Miss
        break;
    }
    this.judgementTexts.push(new JudgementText(x, y, text, color, sizeMultiplier, durationMultiplier));
  }

  createShockwave(x, y, color) {
    this.shockwaves.push(new Shockwave(x, y, color));
  }

  createFlickEffect(x, y, color) {
    const count = 25; // Create a burst of sharp particles
    for (let i = 0; i < count; i++) {
        let p = this.particlePool.pop();
        if (p) {
            // Reset with custom velocity for an upward, sharp burst
            p.reset(x, y, color, {
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 10 - 5, // Strong upward velocity
                gravity: 0.4,
                rotationSpeed: (Math.random() - 0.5) * 10,
                shape: 'triangle', // Use a sharper shape
            });
        } else {
            p = new Particle(x, y, color, {
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 10 - 5,
                gravity: 0.4,
                rotationSpeed: (Math.random() - 0.5) * 10,
                shape: 'triangle',
            });
        }
        this.particles.push(p);
    }
  }

  createComboMilestoneEffect(combo) {
      if (!this.canvas) return;
      const x = this.canvas.width / 2;
      const y = this.canvas.height / 2;
      const text = `${combo}`;
      const color = 'gold';
      this.judgementTexts.push(new JudgementText(x, y, text, color, 1.5, 1.5, true)); // Add isMilestone flag
  }

  update() {
    const stillAliveParticles = [];
    for (const particle of this.particles) {
      particle.update();
      if (particle.isAlive()) {
        stillAliveParticles.push(particle);
      } else {
        this.particlePool.push(particle);
      }
    }
    this.particles = stillAliveParticles;

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
