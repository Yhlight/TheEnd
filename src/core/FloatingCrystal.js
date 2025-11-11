// src/core/FloatingCrystal.js

import { BackgroundElement } from './BackgroundElement.js';

export class FloatingCrystal extends BackgroundElement {
    constructor(canvas) {
        super(canvas);
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 15 + 5; // Rhombus size
        this.rotation = Math.random() * Math.PI * 2; // Initial angle
        this.rotationSpeed = (Math.random() - 0.5) * 0.01; // Radians per frame
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;

        this.maxLife = 1;
        this.fadeInSpeed = 0.005;
        this.fadeOutSpeed = 0.005;
    }

    update() {
        super.update(); // Handles fade in/out logic

        // Movement
        this.x += this.speedX;
        this.y += this.speedY;

        // Rotation
        this.rotation += this.rotationSpeed;

        // Wall bouncing logic
        if (this.x - this.size / 2 < 0 || this.x + this.size / 2 > this.canvas.width) {
            this.speedX *= -1;
        }
        if (this.y - this.size / 2 < 0 || this.y + this.size / 2 > this.canvas.height) {
            this.speedY *= -1;
        }
    }

    draw(ctx, brightness) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw the rhombus/crystal shape
        ctx.beginPath();
        ctx.moveTo(0, -this.size); // Top point
        ctx.lineTo(this.size / 2, 0); // Right point
        ctx.lineTo(0, this.size); // Bottom point
        ctx.lineTo(-this.size / 2, 0); // Left point
        ctx.closePath();

        // Style the crystal
        const alpha = this.life * 0.4 * brightness; // Make them subtle
        ctx.fillStyle = `rgba(150, 180, 255, ${alpha})`;
        ctx.fill();

        ctx.restore();
    }
}
