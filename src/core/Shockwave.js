// src/core/Shockwave.js

export class Shockwave {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 20;
        this.maxRadius = 150;
        this.life = 1;
        this.lineWidth = 15;
    }

    update() {
        this.radius += (this.maxRadius - this.radius) * 0.1;
        this.life -= 0.05;
        this.lineWidth *= 0.9;
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
