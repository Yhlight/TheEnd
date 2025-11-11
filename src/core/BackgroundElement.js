// src/core/BackgroundElement.js

// A base class for background elements
export class BackgroundElement {
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
