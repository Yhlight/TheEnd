// src/core/Particle.js

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;

    // Randomize movement properties for variety
    this.size = Math.random() * 5 + 2; // Size between 2 and 7
    this.vx = (Math.random() - 0.5) * 8; // Horizontal velocity
    this.vy = (Math.random() - 0.5) * 8; // Vertical velocity

    // Lifespan
    this.life = 100; // Particle lives for 100 frames
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1; // Decrease life
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life / 100; // Fade out as it dies
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }

  isAlive() {
    return this.life > 0;
  }
}
