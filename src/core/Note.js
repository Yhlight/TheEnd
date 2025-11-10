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
  }

  markAsMissed() {
    if (!this.isMissed) {
      this.isMissed = true;
      this.fadeTimer = this.fadeDuration;
    }
  }

  update() {
    if (this.isMissed) {
      if (this.fadeTimer > 0) {
        this.fadeTimer--;
      }
    } else {
      this.y += this.speed;
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

    this.ctx.fillStyle = this.color;
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = this.color;

    this.ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }
}
