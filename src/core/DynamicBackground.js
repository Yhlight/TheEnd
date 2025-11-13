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

class GridLine {
    constructor(width, height, isHorizontal) {
        this.width = width;
        this.height = height;
        this.isHorizontal = isHorizontal;
        this.position = Math.random() * (isHorizontal ? height : width);
        this.opacity = 1;
        this.ttl = 0.5; // seconds
        this.velocity = (Math.random() - 0.5) * 200;
    }

    update(dt) {
        this.ttl -= dt;
        this.opacity = Math.max(0, this.ttl / 0.5);
        this.position += this.velocity * dt;

        if (this.position < 0 || (this.isHorizontal && this.position > this.height) || (!this.isHorizontal && this.position > this.width)) {
            this.velocity *= -0.9; // Dampen and reverse
        }
    }

    draw(ctx) {
        ctx.strokeStyle = `rgba(220, 220, 255, ${this.opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (this.isHorizontal) {
            ctx.moveTo(0, this.position);
            ctx.lineTo(this.width, this.position);
        } else {
            ctx.moveTo(this.position, 0);
            ctx.lineTo(this.position, this.height);
        }
        ctx.stroke();
    }
}


export class DynamicBackground {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.brightness = 1;
        this.crystals = Array.from({ length: 15 }, () => new FloatingCrystal(width, height));
        this.lines = Array.from({ length: 25 }, () => new MovingLine(width, height));
        this.gridLines = [];
    }

    setBrightness(value) {
        this.brightness = value;
    }

    triggerEffect() {
        // Create a flash of grid lines
        for (let i = 0; i < 10; i++) {
            this.gridLines.push(new GridLine(this.width, this.height, true)); // Horizontal
            this.gridLines.push(new GridLine(this.width, this.height, false)); // Vertical
        }
    }

    update(dt = 1/60) {
        this.crystals.forEach(crystal => crystal.update(dt));
        this.lines.forEach(line => line.update(dt));

        this.gridLines.forEach(line => line.update(dt));
        this.gridLines = this.gridLines.filter(line => line.ttl > 0);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.brightness;
        this.crystals.forEach(crystal => crystal.draw(ctx));
        this.lines.forEach(line => line.draw(ctx));
        this.gridLines.forEach(line => line.draw(ctx));
        ctx.restore();
    }
}
