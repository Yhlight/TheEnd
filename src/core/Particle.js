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

    // Rotation properties for line segment effect
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1.5; // Decrease life faster
    this.angle += this.rotationSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life / 100;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Draw as a glowing line segment
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-this.size, 0);
    ctx.lineTo(this.size, 0);
    ctx.stroke();

    ctx.restore();
  }

  isAlive() {
    return this.life > 0;
  }
}
