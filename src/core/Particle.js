// src/core/Particle.js

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;

    // Randomize movement properties for variety
    this.size = Math.random() * 8 + 4; // Size between 4 and 12
    this.vx = (Math.random() - 0.5) * 12; // Horizontal velocity
    this.vy = (Math.random() - 0.5) * 12; // Vertical velocity
    this.gravity = 0.1; // A slight downward pull

    // Lifespan
    this.life = 100; // Particle lives for 100 frames
    this.initialLife = 100;

    // Rotation properties for square effect
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity; // Apply gravity
    this.life -= 2; // Decrease life
    this.angle += this.rotationSpeed;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.initialLife);
    if (alpha <= 0) return;

    ctx.save();

    // Translate, rotate, and set alpha
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = alpha;

    // Draw as a glowing, semi-transparent square
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

    ctx.restore();
  }

  isAlive() {
    return this.life > 0;
  }
}
