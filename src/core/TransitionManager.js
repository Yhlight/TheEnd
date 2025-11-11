// src/core/TransitionManager.js
import { Easing } from './Easing.js';

const deltaTime = 1 / 60; // Assuming 60 FPS

export class TransitionManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.alpha = 1.0; // Start fully black
    this.duration = 0;
    this.timer = 0;
    this.isFading = false;
    this.onComplete = null;
    this.direction = 1; // 1 for fadeIn (black to transparent), -1 for fadeOut (transparent to black)
  }

  _startFade(duration, direction, onComplete = null) {
    this.duration = duration;
    this.timer = duration;
    this.direction = direction;
    this.isFading = true;
    this.onComplete = onComplete;
  }

  fadeIn(duration = 0.5) {
    this._startFade(duration, -1); // Fade from 1 to 0
    this.alpha = 1.0;
  }

  fadeOut(duration = 0.5, onComplete = null) {
    this._startFade(duration, 1, onComplete); // Fade from 0 to 1
    this.alpha = 0.0;
  }

  update() {
    if (this.isFading) {
      this.timer -= deltaTime;

      const progress = Math.max(0, this.timer / this.duration);
      let easedProgress = Easing.easeInOutQuad(progress);

      if (this.direction === 1) { // Fading out (to black)
        this.alpha = 1 - easedProgress;
      } else { // Fading in (to transparent)
        this.alpha = easedProgress;
      }

      if (this.timer <= 0) {
        this.isFading = false;
        if (this.onComplete) {
          this.onComplete();
          this.onComplete = null; // Ensure it only runs once
        }
      }
    }
  }

  draw(ctx) {
    if (this.alpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this.alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
