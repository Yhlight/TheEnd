// src/core/DynamicBackground.js

// A base class for background elements
class BackgroundElement {
    constructor(canvas) {
        this.canvas = canvas;
        this.life = 0; // Start at 0 for fade-in
        this.maxLife = 1;
        this.fadeInSpeed = 0.05;
        this.fadeOutSpeed = 0.01;
        this.isFadingIn = true;
    }

    update() {
        if (this.isFadingIn) {
            this.life += this.fadeInSpeed;
            if (this.life >= this.maxLife) {
                this.life = this.maxLife;
                this.isFadingIn = false;
            }
        } else {
            this.life -= this.fadeOutSpeed;
        }
    }

    isDead() {
        return this.life <= 0;
    }

    draw(ctx) {
        // To be implemented by subclasses
    }
}

// A moving line element that drifts across the screen
class MovingLine extends BackgroundElement {
    constructor(canvas) {
        super(canvas);
        this.isHorizontal = Math.random() > 0.5;
        this.thickness = Math.random() * 2 + 1;
        this.fadeOutSpeed = Math.random() * 0.005 + 0.001;

        if (this.isHorizontal) {
            this.x = Math.random() * canvas.width;
            this.y = -this.thickness; // Start off-screen top
            this.length = Math.random() * canvas.width * 0.3 + 20;
            this.speed = Math.random() * 0.5 + 0.2;
        } else { // Vertical
            this.x = -this.thickness; // Start off-screen left
            this.y = Math.random() * canvas.height;
            this.length = Math.random() * canvas.height * 0.3 + 20;
            this.speed = Math.random() * 0.5 + 0.2;
        }
    }

    update() {
         // This element lives forever until it moves off-screen
         if (this.isHorizontal) {
            this.y += this.speed;
         } else {
            this.x += this.speed;
         }
    }

    isDead() {
         if (this.isHorizontal && this.y > this.canvas.height) {
             return true;
         }
         if (!this.isHorizontal && this.x > this.canvas.width) {
             return true;
         }
         return false;
    }

    draw(ctx, brightness) {
        ctx.fillStyle = `rgba(100, 100, 100, ${0.5 * brightness})`;
        if (this.isHorizontal) {
            ctx.fillRect(this.x - this.length / 2, this.y, this.length, this.thickness);
        } else {
            ctx.fillRect(this.x, this.y - this.length / 2, this.thickness, this.length);
        }
    }
}

// A flashing grid line effect
class GridLine extends BackgroundElement {
    constructor(canvas, isHorizontal, position) {
        super(canvas);
        this.isHorizontal = isHorizontal;
        this.position = position;
        this.thickness = 1.5;
        this.fadeInSpeed = 0.25; // Faster fade in
        this.fadeOutSpeed = 0.08; // Faster fade out
    }

    draw(ctx, brightness) {
        // Use a brighter color for the effect
        ctx.fillStyle = `rgba(200, 200, 200, ${this.life * brightness})`;
        if (this.isHorizontal) {
            ctx.fillRect(0, this.position, this.canvas.width, this.thickness);
        } else {
            ctx.fillRect(this.position, 0, this.thickness, this.canvas.height);
        }
    }
}


export class DynamicBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.elements = [];
        this.maxMovingLines = 30;
        this.brightness = 1.0;
    }

    setBrightness(newBrightness) {
        this.brightness = Math.max(0, Math.min(1, newBrightness));
    }

    // Call this when a note is hit to create a visual effect
    triggerEffect() {
        const lineCount = Math.floor(Math.random() * 5) + 5; // 5 to 9 lines
        // Horizontal lines
        for (let i = 0; i < lineCount; i++) {
            const y = Math.random() * this.canvas.height;
            this.elements.push(new GridLine(this.canvas, true, y));
        }
        // Vertical lines
        for (let i = 0; i < lineCount; i++) {
            const x = Math.random() * this.canvas.width;
            this.elements.push(new GridLine(this.canvas, false, x));
        }
    }

    update() {
        // Add new moving lines if needed
        const movingLineCount = this.elements.filter(el => el instanceof MovingLine).length;
        if (movingLineCount < this.maxMovingLines && Math.random() > 0.9) {
             this.elements.push(new MovingLine(this.canvas));
        }

        // Update all elements
        for (const element of this.elements) {
            element.update();
        }

        // Remove dead elements
        this.elements = this.elements.filter(element => !element.isDead());
    }

    draw(ctx) {
        // Set a base background color that is also affected by brightness
        const baseGray = 26; // Corresponds to #1a1a1a
        ctx.fillStyle = `rgba(${baseGray * this.brightness}, ${baseGray * this.brightness}, ${baseGray * this.brightness}, 1)`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (const element of this.elements) {
            element.draw(ctx, this.brightness);
        }
    }
}
