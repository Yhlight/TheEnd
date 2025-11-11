// src/core/EffectManager.js
import { Particle } from './Particle.js';
import { JudgementText } from './JudgementText.js';
import { Shockwave } from './Shockwave.js';

const deltaTime = 1 / 60; // Assuming 60 FPS

export class EffectManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.particles = [];
    this.judgementTexts = [];
    this.shockwaves = [];
  }

  /**
   * Creates a cluster of particles at a specific location.
   */
  createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  /**
   * Creates a judgement text effect.
   */
  createJudgementText(x, y, text, color) {
    this.judgementTexts.push(new JudgementText(x, y, text, color));
  }

  createShockwave(x, y, color) {
    this.shockwaves.push(new Shockwave(this.canvas, x, y, color));
  }

  update() {
    // Update particles
    for (const particle of this.particles) {
      particle.update();
    }
    this.particles = this.particles.filter(p => p.isAlive());

    // Update judgement texts
    for (const text of this.judgementTexts) {
      text.update(deltaTime);
    }
    this.judgementTexts = this.judgementTexts.filter(t => t.isAlive());

    // Update shockwaves
    for (const shockwave of this.shockwaves) {
        shockwave.update();
    }
    this.shockwaves = this.shockwaves.filter(s => !s.isDead());
  }

  draw(ctx) {
    // Draw particles
    for (const particle of this.particles) {
      particle.draw(ctx);
    }

    // Draw judgement texts
    for (const text of this.judgementTexts) {
      text.draw(ctx);
    }

    // Draw shockwaves
    for (const shockwave of this.shockwaves) {
        shockwave.draw(ctx);
    }
  }
}
