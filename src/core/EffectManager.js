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

  createHitEffect(x, y, color, judgement) {
    switch (judgement) {
      case 'Perfect': {
        const triangleCount = 20;
        for (let i = 0; i < triangleCount; i++) {
          const speed = Math.random() * 8 + 5;
          const angle = Math.random() * Math.PI * 2;
          const p = this.particlePool.pop() || new Particle(x, y, color);
          p.reset(x, y, 'white', {
            shape: 'triangle',
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0.1,
            rotationSpeed: (Math.random() - 0.5) * 20,
          });
          this.particles.push(p);
        }

        const lineCount = 15;
        for (let i = 0; i < lineCount; i++) {
          const p = this.particlePool.pop() || new Particle(x, y, color);
          p.reset(x, y, color, { shape: 'line' });
          this.particles.push(p);
        }
        break;
      }
      case 'Good': {
        const squareCount = 15;
        for (let i = 0; i < squareCount; i++) {
          const speed = Math.random() * 4 + 1;
          const angle = Math.random() * Math.PI * 2;
          const p = this.particlePool.pop() || new Particle(x, y, color);
          p.reset(x, y, color, {
            shape: 'square',
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0.2,
          });
          this.particles.push(p);
        }
        break;
      }
      default:
        break;
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
      const color = '#FFD700'; // Gold color

      // 1. Create the prominent text
      this.judgementTexts.push(new JudgementText(x, y, text, color, 1.5, 1.5, true));

      // 2. Create a large, fast shockwave
      const shockwave = new Shockwave(x, y, color, { radius: 150, speed: 8, lineWidth: 15 });
      this.shockwaves.push(shockwave);

      // 3. Create a burst of line particles
      const lineCount = 50;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2; // Evenly spaced burst
        const speed = Math.random() * 10 + 10;
        const p = this.particlePool.pop() || new Particle(x, y, color);
        p.reset(x, y, color, {
            shape: 'line',
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
        });
        this.particles.push(p);
      }
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

  reset() {
    this.particles = [];
    this.judgementTexts = [];
    this.shockwaves = [];
    // Note: We keep the particlePool intact for reuse.
  }
}
