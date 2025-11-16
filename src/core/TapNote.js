// src/core/TapNote.js
import { BaseNote } from './BaseNote.js';
import { Easing } from './Easing.js';

const HIT_ANIMATION_DURATION = 200; // ms

export class TapNote extends BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier) {
    super(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier);
    this.color = '#FF8080'; // A reddish color for tap notes
    this.baseWidth = 120;
    this.baseHeight = 25;
    this.isHit = false;
    this.hitAnimationTime = 0;
    this.setSizeMultiplier(sizeMultiplier || 1);
  }

  hit() {
    this.isHit = true;
  }

  update(gameTime, dt) {
    if (this.isHit) {
      // If the note is hit, run the hit animation
      this.hitAnimationTime += dt * 1000; // dt is in seconds, so convert to ms
      if (this.hitAnimationTime > HIT_ANIMATION_DURATION) {
        this.hitAnimationTime = HIT_ANIMATION_DURATION;
      }
    } else {
      // Otherwise, just call the base update to move the note
      super.update(gameTime, dt);
    }
  }

  isAlive() {
    // A note is alive if it's not missed and its hit animation hasn't finished
    return !this.isMissed && this.hitAnimationTime < HIT_ANIMATION_DURATION;
  }

  draw(ctx, judgementLineX) {
    if (!this.isAlive()) return;

    let scale = this.scale;
    let alpha = this.alpha;

    if (this.isHit) {
      const progress = this.hitAnimationTime / HIT_ANIMATION_DURATION;
      // Ease out the animation for a smoother effect
      const easedProgress = Easing.easeOutCubic(progress);

      scale = this.scale * (1 + easedProgress * 0.5); // Scale up to 150%
      alpha = this.alpha * (1 - easedProgress);      // Fade out
    }

    const renderX = (this.canvas.width / 2) + judgementLineX + (this.x - 0.5) * this.canvas.width;
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(renderX - scaledWidth / 2, this.y - scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.restore();
  }
}
