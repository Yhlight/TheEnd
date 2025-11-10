// src/core/DynamicBackground.js

class BackgroundParticle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedY = Math.random() * 0.5 + 0.1; // Slow downward movement
    this.opacity = Math.random() * 0.5 + 0.2; // Semi-transparent
  }

  update() {
    this.y += this.speedY;
    // Reset particle to the top when it goes off-screen
    if (this.y > this.canvas.height) {
      this.y = 0;
      this.x = Math.random() * this.canvas.width;
    }
  }

  draw(ctx) {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

export class DynamicBackground {
  constructor(canvas, particleCount = 100) {
    this.canvas = canvas;
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new BackgroundParticle(canvas));
    }
  }

  update() {
    for (const particle of this.particles) {
      particle.update();
    }
  }

  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}
