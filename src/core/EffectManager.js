// src/core/EffectManager.js

// --- Particle Class (for explosions) ---
class Particle {
  constructor() {
    this.reset();
  }

  reset(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || (Math.random() - 0.5) * 8;
    this.vy = options.vy || (Math.random() - 0.5) * 8;
    this.gravity = options.gravity || 0.1;
    this.life = 100; // in frames
    this.alpha = 1;
    this.size = Math.random() * 10 + 5;
    this.color = options.color || '#FFFFFF';
    this.shape = options.shape || (Math.random() > 0.5 ? 'square' : 'triangle');
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    return this;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.rotationSpeed;
    this.life--;
    this.alpha = this.life / 100;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    if (this.shape === 'square') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else { // triangle
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// --- JudgementText Class ---
class JudgementText {
  constructor(text, x, y, sizeMultiplier = 1, durationMultiplier = 1) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.life = 120 * durationMultiplier;
    this.maxLife = 120 * durationMultiplier;
    this.size = 60 * sizeMultiplier;
    this.alpha = 1;
  }

  update() {
    this.life--;
    const progress = this.life / this.maxLife;
    this.alpha = Math.sin(progress * Math.PI); // Fade in and out
    this.y -= 0.5; // Drift upwards
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = `bold ${this.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillStyle = this.text === 'Perfect' ? '#FFD700' : '#FFFFFF';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// --- Shockwave Class ---
class Shockwave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 60;
        this.maxLife = 60;
        this.radius = 0;
        this.maxRadius = 200;
        this.alpha = 1;
    }

    update() {
        this.life--;
        const progress = 1 - (this.life / this.maxLife);
        this.radius = progress * this.maxRadius;
        this.alpha = 1 - progress;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}


/**
 * Manages all visual effects like particles, judgement text, and shockwaves.
 * Uses an object pool for particles to improve performance.
 */
export class EffectManager {
  constructor() {
    this.effects = [];
    this.particlePool = Array.from({ length: 200 }, () => new Particle());
  }

  _getFromPool() {
    const particle = this.particlePool.find(p => p.life <= 0);
    return particle || null; // Return null if pool is exhausted
  }

  update() {
    this.effects = this.effects.filter(effect => {
      effect.update();
      return effect.life > 0;
    });
  }

  draw(ctx, canvasWidth, canvasHeight) {
    const renderX = (x) => (x - 0.5) * canvasWidth;
    const renderY = (y) => y; // Y is already in canvas space relative to line

    this.effects.forEach(effect => {
      // Effects need their coordinates transformed just like notes
      if (effect instanceof Particle) {
          effect.draw(ctx);
      } else if (effect instanceof JudgementText) {
          // Judgement text is screen-space, not world-space
          const screenX = canvasWidth / 2 + (effect.x - 0.5) * canvasWidth / 2;
          const screenY = canvasHeight * 0.4;
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
          effect.draw(ctx, screenX, screenY);
          ctx.restore();
      } else if (effect instanceof Shockwave) {
          effect.draw(ctx);
      }
    });
  }

  createExplosion(x, y, judgement) {
    const count = judgement === 'perfect' ? 40 : 20;
    const color = judgement === 'perfect' ? '#FFD700' : '#FFFFFF';

    for (let i = 0; i < count; i++) {
      const particle = this._getFromPool();
      if (particle) {
        this.effects.push(particle.reset(x, y, { color }));
      }
    }
  }

  createJudgementText(judgement, x, y) {
      if (judgement === 'miss') return;
      const text = judgement.charAt(0).toUpperCase() + judgement.slice(1);
      this.effects.push(new JudgementText(text, x, y));
  }

  createShockwave(x, y) {
      this.effects.push(new Shockwave(x, y));
  }
}
