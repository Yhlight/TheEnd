export class Note {
  constructor(canvas, x, judgementLineY, scrollTime) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.x = x;
    this.y = 0;
    this.width = 100;
    this.height = 30;
    this.color = '#FF00FF';

    const distance = judgementLineY;
    const timeInSeconds = scrollTime / 1000;
    const frames = timeInSeconds * 60;
    this.speed = distance / frames;

    // Miss animation properties
    this.isMissed = false;
    this.fadeDuration = 20; // Fade out over 20 frames
    this.fadeTimer = 0;

    // Approach animation properties
    this.approachAnimationProgress = 0;
    this.approachThreshold = 200; // Start animation when 200px away
  }

  markAsMissed() {
    if (!this.isMissed) {
      this.isMissed = true;
      this.fadeTimer = this.fadeDuration;
    }
  }

  update(judgementLineY) {
    if (this.isMissed) {
      if (this.fadeTimer > 0) {
        this.fadeTimer--;
      }
    } else {
      this.y += this.speed;

      // Update approach animation
      const distance = judgementLineY - this.y;
      if (distance > 0 && distance < this.approachThreshold) {
        this.approachAnimationProgress = 1 - (distance / this.approachThreshold);
      } else if (distance <= 0) {
        this.approachAnimationProgress = 1; // Animation complete
      }
    }
  }

  isAlive() {
    // A note is considered "alive" if it's not missed, or if its miss animation is still playing.
    return !this.isMissed || this.fadeTimer > 0;
  }

  draw() {
    const fadeProgress = this.fadeTimer / this.fadeDuration;

    this.ctx.save();
    if (this.isMissed) {
      this.ctx.globalAlpha = fadeProgress; // Fade out
    }

    // Draw base note
    this.ctx.fillStyle = this.color;
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = this.color;
    this.ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    // Draw approach animation overlay
    if (!this.isMissed && this.approachAnimationProgress > 0) {
      const innerWidth = this.width * (1 - this.approachAnimationProgress);
      const innerHeight = this.height * (1 - this.approachAnimationProgress);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillRect(
        this.x - innerWidth / 2,
        this.y - innerHeight / 2,
        innerWidth,
        innerHeight
      );
    }

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }
}
