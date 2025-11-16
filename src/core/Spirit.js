// src/core/Spirit.js
import { Easing } from './Easing.js';

// --- Debris Particle ---
// Represents the orbiting geometric shapes around the core.
class Debris {
    constructor(spiritSize) {
        // Kinematics
        this.angle = Math.random() * Math.PI * 2;
        this.orbitalSpeed = (Math.random() - 0.5) * 0.02 + 0.005; // Slow, majestic orbit
        this.rotationSpeed = (Math.random() - 0.5) * 0.015;

        // Position & Size
        this.baseDistance = spiritSize * 1.8 + Math.random() * spiritSize * 3;
        this.distance = this.baseDistance;
        this.rotation = Math.random() * Math.PI * 2;
        this.size = Math.random() * 8 + 4; // Range of sizes for variety

        // Shape & Appearance
        this.shape = Math.random() > 0.6 ? 'square' : 'line'; // Prioritize lines
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.5 + 0.2; // Base transparency
        this.life = Math.random() * 100; // Start at a random life point for variety
    }

    update(dt, combo) {
        this.life += dt;
        this.angle += this.orbitalSpeed;
        this.rotation += this.rotationSpeed;

        // Breathing effect: distance oscillates around the base distance
        this.distance = this.baseDistance + Math.sin(this.life * 1.5 + this.angle) * 5;

        // Fade in when created
        if (this.alpha < this.targetAlpha) {
            this.alpha = Math.min(this.targetAlpha, this.alpha + 0.03);
        }
    }

    draw(ctx, spiritX, spiritY) {
        // Calculate world position
        const x = spiritX + Math.cos(this.angle) * this.distance;
        const y = spiritY + Math.sin(this.angle) * this.distance;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.lineWidth = 1.5;

        if (this.shape === 'square') {
            ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else { // 'line'
            ctx.beginPath();
            ctx.moveTo(0, -this.size / 1.5);
            ctx.lineTo(0, this.size / 1.5);
            ctx.stroke();
        }

        ctx.restore();
    }
}


// --- Spirit Core ---
// The central visual element on the judgement line.
export class Spirit {
    constructor(judgementLine) {
        this.judgementLine = judgementLine;

        // Core properties
        this.baseSize = 18;
        this.rotation = 0;
        this.pulseTimer = Math.random() * Math.PI * 2;
        this.yOffset = 0; // For title screen floating

        // State properties
        this.size = this.baseSize;
        this.glow = 10;
        this.hitColor = 'white';
        this.colorAlpha = 0;

        // Animation states
        this.hitAnimation = { timer: 0, scale: 1, rings: [] };
        this.missAnimationTimer = 0;

        // Combo-driven elements
        this.combo = 0;
        this.debris = [];

        // Initialize with some debris for the title screen aesthetic
        for (let i = 0; i < 5; i++) {
            this.debris.push(new Debris(this.baseSize * 2.5));
        }
    }

    // Animation loop specifically for the title screen
    updateForTitle(dt = 1 / 60) {
        this.pulseTimer += dt;
        this.rotation += dt * 0.25; // Gentle rotation

        // Vertical floating animation
        this.yOffset = Math.sin(this.pulseTimer * 1.5) * 8;

        // Breathing/pulsing animation
        const pulse = Math.sin(this.pulseTimer * 2) * 2;
        this.size = (this.baseSize * 2.5) + pulse; // Larger on title screen
        this.glow = 20 + pulse * 2;

        // Update debris particles
        this.debris.forEach(d => d.update(dt, 0));
    }


    setCombo(combo) {
        if (this.combo > combo && combo === 0) { // Combo break
            this.onMiss();
        }
        this.combo = combo;
    }

    onHit(noteColor) {
        this.hitAnimation.timer = 1;
        this.hitAnimation.scale = 1.6;
        this.hitColor = noteColor || 'white';
        this.colorAlpha = 1;
        // Create an expanding ring for the hit effect
        this.hitAnimation.rings.push({ life: 0, alpha: 1 });
    }

    onMiss() {
        this.missAnimationTimer = 1;
        // On miss, make debris fade out
        this.debris.forEach(d => d.targetAlpha = 0);
        // Clear them after they've had a chance to fade
        setTimeout(() => this.debris = [], 500);
    }

    update(dt = 1 / 60) {
        this.pulseTimer += dt;
        this.rotation += dt * 0.15; // Slightly faster base rotation

        // --- Hit Animation ---
        if (this.hitAnimation.timer > 0) {
            this.hitAnimation.timer -= dt * 2.5;
            this.hitAnimation.scale = 1 + Easing.easeOutCubic(this.hitAnimation.timer) * 0.6;
            this.colorAlpha = Easing.easeOutQuint(this.hitAnimation.timer);
        } else {
            this.hitAnimation.scale = 1;
            this.colorAlpha = 0;
        }

        // Update hit rings
        for (let i = this.hitAnimation.rings.length - 1; i >= 0; i--) {
            const ring = this.hitAnimation.rings[i];
            ring.life += dt * 5; // Ring expansion speed
            ring.alpha = 1 - ring.life;
            if (ring.alpha <= 0) {
                this.hitAnimation.rings.splice(i, 1);
            }
        }

        // --- Miss Animation ---
        if (this.missAnimationTimer > 0) {
            this.missAnimationTimer -= dt * 2;
        }

        // --- Combo Effects ---
        let targetSize = this.baseSize;
        if (this.combo >= 50) targetSize = this.baseSize * 1.25;
        if (this.combo >= 100) targetSize = this.baseSize * 1.5;

        // Manage debris based on combo
        const maxDebris = 15;
        const debrisCount = Math.min(maxDebris, Math.floor(this.combo / 8));
        if (this.debris.length < debrisCount) {
            this.debris.push(new Debris(this.size));
        } else if (this.combo === 0 && this.debris.length > 0) {
            this.debris.forEach(d => d.targetAlpha = 0);
            setTimeout(() => this.debris = [], 500);
        }

        this.debris.forEach(d => d.update(dt, this.combo));

        // --- Final Size Calculation (Idle Pulse + Combo Size) ---
        const pulse = Math.sin(this.pulseTimer * 2) * 1.5; // Deeper pulse
        this.size += (targetSize + pulse - this.size) * 0.08; // Smoother interpolation
        this.glow = 15 + (this.size - this.baseSize) * 2 + this.combo / 10;
    }

    draw(ctx, centerX, centerY) {
        const x = centerX !== undefined ? centerX : this.judgementLine.x;
        const y = (centerY !== undefined ? centerY : this.judgementLine.y) + this.yOffset;


        // --- 1. Debris (Background) ---
        this.debris.forEach(d => d.draw(ctx, x, y));

        ctx.save();
        ctx.translate(x, y);

        // --- Miss/Glitch Effect ---
        if (this.missAnimationTimer > 0) {
            const glitch = Easing.easeOutCubic(this.missAnimationTimer) * 15;
            ctx.translate((Math.random() - 0.5) * glitch, (Math.random() - 0.5) * glitch);
            ctx.rotate((Math.random() - 0.5) * glitch * 0.02);
        }

        const finalSize = this.size * this.hitAnimation.scale;

        // --- 2. Glows ---
        ctx.shadowColor = this.hitColor;
        ctx.shadowBlur = this.glow + this.colorAlpha * 30; // Hit makes glow pulse intensely

        // --- 3. Hit Rings ---
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.colorAlpha * 0.8})`;
        this.hitAnimation.rings.forEach(ring => {
            ctx.lineWidth = 3 * ring.alpha;
            ctx.globalAlpha = ring.alpha;
            ctx.beginPath();
            ctx.arc(0, 0, finalSize + ring.life * 50, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;


        // --- 4. Core Structure (Multi-layered Rhombus) ---
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Reset stroke style to prevent alpha inheritance

        const layers = 3;
        for (let i = 0; i < layers; i++) {
            const layerSize = finalSize * (1 - i * 0.2);
            const layerAlpha = 0.8 - i * 0.2;
            const layerRotation = this.rotation * (i % 2 === 0 ? 1 : -1) * (1 + i * 0.1);

            ctx.save();
            ctx.rotate(layerRotation + 45 * Math.PI / 180);
            ctx.strokeStyle = `rgba(255, 255, 255, ${layerAlpha})`;
            ctx.strokeRect(-layerSize / 2, -layerSize / 2, layerSize, layerSize);
            ctx.restore();
        }

        // --- 5. Inner Cross/Star ---
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        const starSize = finalSize * 0.9;

        ctx.save();
        ctx.rotate(-this.rotation * 1.5); // Counter-rotation for dynamic feel
        ctx.beginPath();
        ctx.moveTo(-starSize, 0);
        ctx.lineTo(starSize, 0);
        ctx.moveTo(0, -starSize);
        ctx.lineTo(0, starSize);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
}
