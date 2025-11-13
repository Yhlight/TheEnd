// src/core/DynamicBackground.js

class FloatingCrystal {
    constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 20 + 10; // 10 to 30
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.width = width;
        this.height = height;
    }

    update(dt) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.x < -this.size || this.x > this.width + this.size) this.speedX *= -1;
        if (this.y < -this.size || this.y > this.height + this.size) this.speedY *= -1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -this.size); // Top point
        ctx.lineTo(this.size / 2, 0); // Right point
        ctx.lineTo(0, this.size); // Bottom point
        ctx.lineTo(-this.size / 2, 0); // Left point
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

class MovingLine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.5 + 0.1;
        this.length = Math.random() * 200 + 100;
        this.opacity = Math.random() * 0.3 + 0.1;
    }

    update(dt) {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (this.x < -this.length || this.x > this.width + this.length || this.y < -this.length || this.y > this.height + this.length) {
            // Reset when out of bounds
            this.x = Math.random() * this.width;
            this.y = Math.random() * this.height;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = `rgba(200, 200, 255, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y + Math.sin(this.angle) * this.length);
        ctx.stroke();
    }
}


export class DynamicBackground {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.crystals = Array.from({ length: 15 }, () => new FloatingCrystal(width, height));
        this.lines = Array.from({ length: 25 }, () => new MovingLine(width, height));
    }

    update(dt) {
        this.crystals.forEach(crystal => crystal.update(dt));
        this.lines.forEach(line => line.update(dt));
    }

    draw(ctx) {
        ctx.save();
        // Placeholder for background-specific drawing logic
        this.crystals.forEach(crystal => crystal.draw(ctx));
        this.lines.forEach(line => line.draw(ctx));
        ctx.restore();
    }
}
