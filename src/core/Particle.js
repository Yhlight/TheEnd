// src/core/Particle.js

export class Particle {
  constructor(x, y, color, options = {}) {
    this.#initialize(x, y, color, options);
  }

  #initialize(x, y, color, options) {
    this.x = x;
    this.y = y;
    this.color = color;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 3;

    this.shape = options.shape ?? (Math.random() > 0.5 ? 'square' : 'triangle');

    // Shape-specific defaults
    let defaultVx = Math.cos(angle) * speed;
    let defaultVy = Math.sin(angle) * speed;
    let defaultGravity = 0.2;
    let defaultSize = Math.random() * 6 + 3;
    let defaultMaxLife = Math.random() * 60 + 40;
    let defaultRotationSpeed = (Math.random() - 0.5) * 15;

    if (this.shape === 'line') {
      const lineSpeed = Math.random() * 12 + 6;
      defaultVx = Math.cos(angle) * lineSpeed;
      defaultVy = Math.sin(angle) * lineSpeed;
      defaultGravity = 0; // Lines don't fall
      defaultSize = Math.random() * 15 + 10; // Length of the line
      defaultMaxLife = Math.random() * 20 + 20; // Shorter lifespan
    }

    // Customizable properties via options
    this.vx = options.vx ?? defaultVx;
    this.vy = options.vy ?? defaultVy;
    this.gravity = options.gravity ?? defaultGravity;
    this.rotationSpeed = options.rotationSpeed ?? defaultRotationSpeed;

    // Non-customizable properties
    this.size = defaultSize;
    this.friction = 0.98;
    this.rotation = (Math.atan2(this.vy, this.vx) * 180 / Math.PI) + 90; // Align with velocity for lines
    this.maxLife = defaultMaxLife;
    this.life = this.maxLife;
  }

  update() {
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
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);

    const alpha = Math.max(0, this.life / this.maxLife);
    const currentSize = this.size * (this.life / this.maxLife);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;

    switch (this.shape) {
      case 'square':
        ctx.fillRect(-currentSize / 2, -currentSize / 2, currentSize, currentSize);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -currentSize / 2);
        ctx.lineTo(currentSize / 2, currentSize / 2);
        ctx.lineTo(-currentSize / 2, currentSize / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'line':
        ctx.fillRect(-1, -currentSize / 2, 2, currentSize); // Draw a line of 2px width
        break;
    }

    ctx.restore();
  }

  isAlive() {
    return this.life > 0;
  }

  reset(x, y, color, options = {}) {
    this.#initialize(x, y, color, options);
  }
}
