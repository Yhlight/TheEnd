// src/core/DynamicBackground.js

class BackgroundParticle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 20 + 5;
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.speedY = (Math.random() - 0.5) * 0.2;
    this.opacity = Math.random() * 0.1 + 0.05;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.002;
    this.shapeType = ['fill', 'stroke', 'line'][Math.floor(Math.random() * 3)];
    this.color = `rgba(100, 100, 100, ${this.opacity})`;
    this.shadowColor = `rgba(100, 100, 100, ${this.opacity * 0.5})`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.angle += this.rotationSpeed;

    if (this.x > this.canvas.width) this.x = 0;
    if (this.x < 0) this.x = this.canvas.width;
    if (this.y > this.canvas.height) this.y = 0;
    if (this.y < 0) this.y = this.canvas.height;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.shadowColor;

    if (this.shapeType === 'fill') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else { // 'stroke' or 'line'
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 1;
      if (this.shapeType === 'stroke') {
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else {
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export class DynamicBackground {
  constructor(canvas, particleCount = 30) {
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
