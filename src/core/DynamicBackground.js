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

    update(dt, intensityMultiplier = 1) {
        this.x += this.speedX * intensityMultiplier;
        this.y += this.speedY * intensityMultiplier;
        this.rotation += this.rotationSpeed * intensityMultiplier;

        if (this.x < -this.size || this.x > this.width + this.size) this.speedX *= -1;
        if (this.y < -this.size || this.y > this.height + this.size) this.speedY *= -1;
    }

    draw(ctx, intensity = 0) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const baseAlpha = 0.3;
        const alpha = baseAlpha + intensity * 0.2; // Increase alpha with intensity
        ctx.strokeStyle = `rgba(200, 200, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(150, 150, 255, 0.8)';
        ctx.shadowBlur = 5 + intensity * 10; // Increase glow with intensity


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

    update(dt, intensityMultiplier = 1) {
        this.x += Math.cos(this.angle) * this.speed * intensityMultiplier;
        this.y += Math.sin(this.angle) * this.speed * intensityMultiplier;

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
        this.intensity = 0; // 0 = calm, 1 = medium, 2 = high
        this.crystals = Array.from({ length: 35 }, () => new FloatingCrystal(width, height)); // Create max possible crystals
        this.lines = Array.from({ length: 25 }, () => new MovingLine(width, height));
        this.gridLines = [];
    }

    setBrightness(value) {
        this.brightness = value;
    }

    setIntensity(level) {
        this.intensity = Math.max(0, Math.min(level, 2)); // Clamp between 0 and 2
    }

    triggerEffect() {
        // Create a flash of grid lines
        for (let i = 0; i < 10; i++) {
            this.gridLines.push(new GridLine(this.width, this.height, true)); // Horizontal
            this.gridLines.push(new GridLine(this.width, this.height, false)); // Vertical
        }
    }

    update(dt = 1/60) {
        const intensityMultiplier = 1 + this.intensity * 2; // Up to 5x speed at max intensity
        this.crystals.forEach(crystal => crystal.update(dt, intensityMultiplier));
        this.lines.forEach(line => line.update(dt, intensityMultiplier));

        this.gridLines.forEach(line => line.update(dt));
        this.gridLines = this.gridLines.filter(line => line.ttl > 0);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.brightness;

        // Control crystal count based on intensity
        const crystalCount = 15 + Math.floor(this.intensity * 10); // 15, 25, or 35 crystals
        for(let i = 0; i < crystalCount && i < this.crystals.length; i++) {
            this.crystals[i].draw(ctx, this.intensity);
        }

        // Vary line color with intensity
        this.lines.forEach((line, index) => {
            if (this.intensity > 0 && index % (3 - Math.floor(this.intensity)) === 0) { // More frequent color changes at higher intensity
                 const highIntensityColor = this.intensity > 1 ? 'white' : 'cyan';
                 const originalOpacity = line.opacity;
                 line.opacity = Math.min(1, originalOpacity * 2); // Make them brighter
                 const originalStrokeStyle = ctx.strokeStyle;
                 ctx.strokeStyle = highIntensityColor;
                 line.draw(ctx);
                 ctx.strokeStyle = originalStrokeStyle; // Restore for others
                 line.opacity = originalOpacity; // Restore for next frame logic
            } else {
                line.draw(ctx);
            }
        });

        this.gridLines.forEach(line => line.draw(ctx));
        ctx.restore();
    }
}
