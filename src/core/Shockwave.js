// src/core/Shockwave.js

export class Shockwave {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = options.radius || 20;
        this.maxRadius = options.maxRadius || 150;
        this.speed = options.speed || 5;
        this.life = 1;
        this.lineWidth = options.lineWidth || 15;
    }

    update() {
        this.radius += this.speed;
        this.life -= 0.03; // Slower fade for a more prominent effect
        this.lineWidth *= 0.95; // Slower shrink
    }

    isAlive() {
        return this.life > 0;
    }

    draw(ctx) {
        if (!this.isAlive()) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}
