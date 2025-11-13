// src/core/Particle.js

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;

    // Give particles a more powerful initial velocity burst outwards
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3; // Speed between 3 and 11
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.size = Math.random() * 6 + 3; // Size between 3 and 9

    // Physics properties
    this.gravity = 0.2;
    this.friction = 0.98; // Air resistance
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 15;

    // Lifespan and fade properties
    this.maxLife = Math.random() * 60 + 40; // Lives for 40 to 100 frames
    this.life = this.maxLife;

    // Shape
    this.shape = Math.random() > 0.5 ? 'square' : 'triangle';
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
}
