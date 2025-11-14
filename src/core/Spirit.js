// src/core/Spirit.js
import { Easing } from './Easing.js';

class Debris {
    constructor(spiritX, spiritY, spiritSize) {
        this.angle = Math.random() * Math.PI * 2;
        this.distance = spiritSize * 1.5 + Math.random() * spiritSize * 2;
        this.rotation = this.angle;
        this.size = Math.random() * 4 + 2;
        this.speed = (Math.random() - 0.5) * 0.05 + 0.01; // Orbital speed
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.5 + 0.2;
    }

    update(dt) {
        this.angle += this.speed;
        this.rotation += this.speed * 2;
        if (this.alpha < this.targetAlpha) {
            this.alpha = Math.min(this.targetAlpha, this.alpha + 0.05);
        }
    }

    draw(ctx, spiritX, spiritY) {
        const x = spiritX + Math.cos(this.angle) * this.distance;
        const y = spiritY + Math.sin(this.angle) * this.distance;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}


export class Spirit {
    constructor(judgementLine) {
        this.judgementLine = judgementLine;

        // Base properties
        this.baseSize = 25;
        this.rotation = 0;

        // State properties affected by animations
        this.size = this.baseSize;
        this.glow = 10;
        this.colorAlpha = 0;
        this.hitColor = 'white';

        // Animation timers and states
        this.pulseTimer = 0;
        this.hitAnimationTimer = 0;
        this.missAnimationTimer = 0;

        // Combo related properties
        this.combo = 0;
        this.debris = [];
    }

    setCombo(combo) {
        this.combo = combo;
    }

    onHit(noteColor) {
        this.hitAnimationTimer = 1; // Start hit animation
        this.hitColor = noteColor || 'white';
        this.colorAlpha = 1;
    }

    onMiss() {
        this.missAnimationTimer = 1; // Start miss animation
        this.debris = []; // Clear all debris on miss
    }

    update(dt = 1/60) {
        this.pulseTimer += dt;

        // --- Handle Hit Animation ---
        if (this.hitAnimationTimer > 0) {
            this.hitAnimationTimer -= dt * 2;
            this.colorAlpha = Math.max(0, this.hitAnimationTimer);
        }

        // --- Handle Miss Animation ---
        if (this.missAnimationTimer > 0) {
            this.missAnimationTimer -= dt * 3;
        }

        // --- Handle Combo Effects ---
        let targetSize = this.baseSize;
        if (this.combo >= 100) {
            targetSize = this.baseSize * 1.4;
        } else if (this.combo >= 50) {
            targetSize = this.baseSize * 1.2;
        }

        // Add debris based on combo
        const debrisCount = Math.floor(this.combo / 25); // One piece of debris every 25 combo
        if (this.debris.length < debrisCount) {
            this.debris.push(new Debris(this.judgementLine.x, this.judgementLine.y, this.size));
        } else if (this.debris.length > debrisCount) {
            this.debris.pop();
        }

        this.debris.forEach(d => d.update(dt));

        // --- Apply pulsing and combo size ---
        const pulse = Math.sin(this.pulseTimer * 2) * 2;
        this.size += (targetSize + pulse - this.size) * 0.1; // Smoothly interpolate to target size

        this.glow = 10 + (this.size - this.baseSize) * 2;
    }

    draw(ctx) {
        const x = this.judgementLine.x;
        const y = this.judgementLine.y;

        // --- Draw Debris ---
        this.debris.forEach(d => d.draw(ctx, x, y));

        ctx.save();

        // --- Miss/Glitch Effect ---
        if (this.missAnimationTimer > 0) {
            const glitchAmount = Easing.easeOutQuad(this.missAnimationTimer) * 20;
            ctx.translate((Math.random() - 0.5) * glitchAmount, (Math.random() - 0.5) * glitchAmount);
        }

        ctx.translate(x, y);
        ctx.rotate(45 * Math.PI / 180); // Rotate to be a rhombus

        // --- Draw Main Body ---
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = this.glow;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // --- Draw Hit Color Overlay ---
        if (this.colorAlpha > 0) {
            ctx.globalAlpha = this.colorAlpha;
            ctx.fillStyle = this.hitColor;
            ctx.shadowColor = this.hitColor;
            const hitSize = this.size * (1 + (1 - Easing.easeOutQuad(this.hitAnimationTimer)) * 0.5);
            ctx.fillRect(-hitSize / 2, -hitSize / 2, hitSize, hitSize);
        }

        ctx.restore();
    }
}
