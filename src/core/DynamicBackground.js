// src/core/DynamicBackground.js

class MovingLine {
  constructor(width, height) {
    this.reset(width, height);
    this.y = Math.random() * height;
  }

  reset(width, height) {
    this.x = Math.random() * width;
    this.y = -50;
    this.vy = Math.random() * 0.5 + 0.1; // Slower speed
    this.length = Math.random() * 200 + 50;
    this.width = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.1 + 0.05; // More subtle
  }

  update(width, height) {
    this.y += this.vy;
    if (this.y > height + this.length) {
      this.reset(width, height);
    }
  }

  draw(ctx) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ctx.lineWidth = this.width;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y - this.length);
    ctx.stroke();
  }
}

class GridLine {
    constructor() {
        this.life = 0;
        this.alpha = 0;
        this.position = 0;
        this.isVertical = false;
    }

    trigger(position, isVertical) {
        this.life = 60; // frames
        this.position = position;
        this.isVertical = isVertical;
    }

    update() {
        if (this.life > 0) {
            this.life--;
            this.alpha = (this.life / 60) * 0.5; // Fade out
        }
    }

    draw(ctx, width, height) {
        if (this.life <= 0) return;
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.isVertical) {
            ctx.moveTo(this.position, 0);
            ctx.lineTo(this.position, height);
        } else {
            ctx.moveTo(0, this.position);
            ctx.lineTo(width, this.position);
        }
        ctx.stroke();
    }
}


export class DynamicBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.lines = Array.from({ length: 50 }, () => new MovingLine(width, height));
    this.gridLines = Array.from({ length: 10 }, () => new GridLine());
    this.brightness = 0.5; // 0 to 1
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.lines.forEach(line => line.reset(width, height));
  }

  setBrightness(brightness) {
      this.brightness = brightness;
  }

  triggerEffect() {
      // Trigger a horizontal and a vertical line flash
      const verticalLine = this.gridLines.find(l => l.life <= 0);
      if (verticalLine) {
          verticalLine.trigger(Math.random() * this.width, true);
      }
      const horizontalLine = this.gridLines.find(l => l.life <= 0);
      if (horizontalLine) {
          horizontalLine.trigger(Math.random() * this.height, false);
      }
  }

  update() {
    this.lines.forEach(line => line.update(this.width, this.height));
    this.gridLines.forEach(line => line.update());
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.brightness;

    // Draw solid background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw moving lines
    this.lines.forEach(line => line.draw(ctx));

    // Draw grid flash lines
    this.gridLines.forEach(line => line.draw(ctx, this.width, this.height));

    ctx.restore();
  }
}
