// src/core/EffectManager.js
import { Particle } from './Particle.js';

export class EffectManager {
  constructor() {
    this.particles = [];
  }

  /**
   * Creates a cluster of particles at a specific location.
   * @param {number} x - The x coordinate of the explosion center.
   * @param {number} y - The y coordinate of the explosion center.
   * @param {string} color - The color of the particles.
   * @param {number} count - The number of particles to create.
   */
  createExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  update() {
    for (const particle of this.particles) {
      particle.update();
    }
    // Remove dead particles
    this.particles = this.particles.filter(p => p.isAlive());
  }

  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}
