// src/core/Spirit.js
import { Easing } from './Easing.js';

class Debris {
    constructor(spiritX, spiritY, spiritSize) {
        // Initial position relative to the core
        this.angle = Math.random() * Math.PI * 2;
        this.distance = spiritSize * 1.5 + Math.random() * spiritSize * 2.5; // More spread out
        this.targetDistance = this.distance;

        // Visual properties
        this.rotation = Math.random() * Math.PI * 2;
        this.size = Math.random() * 6 + 3; // Shards are a bit larger
        this.shape = Math.random() > 0.5 ? 'triangle' : 'line'; // More variety

        // Movement properties
        this.speed = (Math.random() - 0.5) * 0.03 + 0.01; // Slower, more majestic orbital speed
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;

        // Lifecycle properties
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.6 + 0.3; // Brighter shards
        this.life = 0;
    }

    update(dt, combo) {
        this.life += dt;
        this.angle += this.speed;
        this.rotation += this.rotationSpeed;

        // Breathing effect for distance
        this.distance = this.targetDistance + Math.sin(this.life * 2 + this.angle) * 3;

        // Fade in
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

        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 1.5;

        if (this.shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.stroke();
        } else { // 'line'
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(0, this.size);
            ctx.stroke();
        }

        ctx.restore();
    }
}


export class Spirit {
    constructor(judgementLine) {
        this.judgementLine = judgementLine;

        // Base properties
        this.baseSize = 20; // Slightly smaller base
        this.rotation = 0;

        // State properties affected by animations
        this.size = this.baseSize;
        this.glow = 10;
        this.colorAlpha = 0;
        this.hitColor = 'white';

        // Animation timers and states
        this.pulseTimer = Math.random() * Math.PI * 2; // Random start phase
        this.hitAnimation = { timer: 0, scale: 1 }; // More complex hit animation object
        this.missAnimationTimer = 0;

        // Combo related properties
        this.combo = 0;
        this.debris = [];
    }

    setCombo(combo) {
        if (this.combo > combo) { // Combo break
            this.onMiss();
        }
        this.combo = combo;
    }

    onHit(noteColor) {
        this.hitAnimation.timer = 1; // Start hit animation (1 second duration)
        this.hitAnimation.scale = 1.8; // Initial scale burst
        this.hitColor = noteColor || 'white';
        this.colorAlpha = 1;
    }

    onMiss() {
        this.missAnimationTimer = 1; // Start miss animation
        this.debris.forEach(d => d.targetAlpha = 0); // Make debris fade out
        // Instead of clearing immediately, let them fade
        setTimeout(() => this.debris = [], 500);
    }

    update(dt = 1/60) {
        this.pulseTimer += dt;
        this.rotation += dt * 0.1; // Slow constant rotation of the core

        // --- Handle Hit Animation ---
        if (this.hitAnimation.timer > 0) {
            this.hitAnimation.timer -= dt * 3; // Faster decay
            // Animate scale back down with an easing function
            this.hitAnimation.scale = 1 + Easing.easeOutCubic(this.hitAnimation.timer) * 0.8;
            this.colorAlpha = Easing.easeOutCubic(this.hitAnimation.timer);
        } else {
            this.hitAnimation.scale = 1;
            this.colorAlpha = 0;
        }

        // --- Handle Miss Animation ---
        if (this.missAnimationTimer > 0) {
            this.missAnimationTimer -= dt * 3;
        }

        // --- Handle Combo Effects ---
        let targetSize = this.baseSize;
        let coreBrightness = 0.8;
        if (this.combo >= 100) {
            targetSize = this.baseSize * 1.5;
            coreBrightness = 1.0;
        } else if (this.combo >= 50) {
            targetSize = this.baseSize * 1.2;
            coreBrightness = 0.9;
        }

        // Add debris based on combo, up to a max
        const maxDebris = 12;
        const debrisCount = Math.min(maxDebris, Math.floor(this.combo / 10)); // One piece every 10 combo
        if (this.debris.length < debrisCount) {
            this.debris.push(new Debris(this.judgementLine.x, this.judgementLine.y, this.size));
        } else if (this.debris.length > debrisCount && this.combo === 0) {
             // Only remove if combo is 0 to prevent flickering on combo break
             this.debris.pop();
        }

        this.debris.forEach(d => d.update(dt, this.combo));

        // --- Apply pulsing (idle animation) and combo size ---
        const pulse = Math.sin(this.pulseTimer * 1.5) * 2; // Slower, deeper breath
        this.size += (targetSize + pulse - this.size) * 0.1; // Smoothly interpolate to target size

        this.glow = 15 + (this.size - this.baseSize) * 2.5 + this.combo / 10;
        this.coreBrightness = coreBrightness;
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

        // --- Draw Core ---
        const finalSize = this.size * this.hitAnimation.scale;

        // Outer Glow (influenced by hit)
        ctx.shadowColor = this.hitColor;
        ctx.shadowBlur = this.glow * this.hitAnimation.scale;

        // 1. Hit Color Layer (drawn first, underneath)
        if (this.colorAlpha > 0) {
            ctx.globalAlpha = this.colorAlpha * 0.8;
            ctx.strokeStyle = this.hitColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = this.rotation + i * Math.PI / 2;
                const size = finalSize * 1.2; // Slightly larger
                ctx.moveTo(0,0);
                ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;


        // 2. Main Body (Rhombus/Crystal)
        ctx.save();
        ctx.rotate(this.rotation + 45 * Math.PI / 180);

        // Outer stroked rhombus
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.coreBrightness})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(-finalSize / 2, -finalSize / 2, finalSize, finalSize);

        // Inner filled rhombus (creates hollow effect)
        const innerSize = finalSize * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${this.coreBrightness * 0.7})`;
        ctx.fillRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize);

        ctx.restore();

        // 3. Inner cross shape
        ctx.save();
        ctx.rotate(this.rotation);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.coreBrightness * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-finalSize * 0.8, 0);
        ctx.lineTo(finalSize * 0.8, 0);
        ctx.moveTo(0, -finalSize * 0.8);
        ctx.lineTo(0, finalSize * 0.8);
        ctx.stroke();
        ctx.restore();


        ctx.restore(); // Restore from main translate
    }
}
