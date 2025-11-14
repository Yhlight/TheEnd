// src/core/Particle.js

export class Particle {
  constructor(x, y, color, options = {}) {
    this.x = x;
    this.y = y;
    this.color = color;

    // Default values
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;

    // Customizable properties via options
    this.vx = options.vx ?? Math.cos(angle) * speed;
    this.vy = options.vy ?? Math.sin(angle) * speed;
    this.gravity = options.gravity ?? 0.2;
    this.shape = options.shape ?? (Math.random() > 0.5 ? 'square' : 'triangle');
    this.rotationSpeed = options.rotationSpeed ?? (Math.random() - 0.5) * 15;

    // Non-customizable properties
    this.size = Math.random() * 6 + 3;
    this.friction = 0.98;
    this.rotation = Math.random() * 360;
    this.maxLife = Math.random() * 60 + 40;
    this.life = this.maxLife;
  }

  update() {
    // Apply physics
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx;
    this.y += this.vy;

    this.rotation += this.rotationSpeed;

    this.life -= 1;
  }

  draw(ctx) {
    ctx.save();

    // Center the rotation point
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.rotation * Math.PI / 180);

    // Calculate alpha and size based on lifespan
    const alpha = Math.max(0, this.life / this.maxLife);
    const currentSize = this.size * alpha; // Shrink as it fades

    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;

    if (this.shape === 'square') {
        // Draw the particle centered at (0, 0) because of the translation
        ctx.fillRect(-currentSize / 2, -currentSize / 2, currentSize, currentSize);
    } else {
        // Draw a triangle
        ctx.beginPath();
        ctx.moveTo(0, -currentSize / 2);
        ctx.lineTo(currentSize / 2, currentSize / 2);
        ctx.lineTo(-currentSize / 2, currentSize / 2);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
  }

  isAlive() {
    return this.life > 0;
  }

  reset(x, y, color, options = {}) {
    this.x = x;
    this.y = y;
    this.color = color;

    // Default values
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;

    // Customizable properties via options
    this.vx = options.vx ?? Math.cos(angle) * speed;
    this.vy = options.vy ?? Math.sin(angle) * speed;
    this.gravity = options.gravity ?? 0.2;
    this.shape = options.shape ?? (Math.random() > 0.5 ? 'square' : 'triangle');
    this.rotationSpeed = options.rotationSpeed ?? (Math.random() - 0.5) * 15;

    // Non-customizable properties
    this.size = Math.random() * 6 + 3;
    this.rotation = Math.random() * 360;
    this.maxLife = Math.random() * 60 + 40;
    this.life = this.maxLife;
  }
}
