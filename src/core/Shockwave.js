// src/core/Shockwave.js
import { BackgroundElement } from './BackgroundElement.js';

export class Shockwave extends BackgroundElement {
    constructor(canvas, x, y, color) {
        super(canvas);
        this.x = x;
        this.y = y;
        this.color = color || '#FFFFFF';
        this.radius = 0;
        this.maxRadius = 150;
        this.lineWidth = 10;
        this.speed = 4; // How fast the radius grows
        this.fadeOutSpeed = 0.04; // How fast it fades
    }

    update() {
        this.radius += this.speed;
        this.life -= this.fadeOutSpeed;
    }

    isDead() {
        return this.life <= 0 || this.radius >= this.maxRadius;
    }

    draw(ctx) {
        if (this.isDead()) return;

        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth * this.life; // Line gets thinner as it fades
        ctx.globalAlpha = this.life;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
