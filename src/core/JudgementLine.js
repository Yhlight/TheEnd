export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.y = 0;

    // Shockwave effect properties
    this.shockwaves = []; // To hold active shockwave animations
    this.shockwaveDuration = 30; // Shockwave lasts for 30 frames
  }

  update() {
    this.y = this.canvas.height * 0.8;

    // Update all active shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const shockwave = this.shockwaves[i];
      shockwave.progress += 1 / this.shockwaveDuration;
      if (shockwave.progress >= 1) {
        this.shockwaves.splice(i, 1); // Remove completed shockwaves
      }
    }
  }

  /**
   * Triggers the shockwave animation.
   * @param {string} color - The color of the shockwave, typically from the hit note.
   */
  flash(color = '#FFFFFF') {
    this.shockwaves.push({
      progress: 0,
      color: color
    });
  }

  draw() {
    const ctx = this.ctx;

    // Draw the base judgement line
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    ctx.lineTo(this.canvas.width, this.y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    ctx.stroke();

    // Draw all active shockwaves
    this.shockwaves.forEach(shockwave => {
      const easeOutQuad = t => t * (2 - t);
      const easedProgress = easeOutQuad(shockwave.progress);

      const radius = easedProgress * 200; // Max radius of 200px
      const alpha = 1 - easedProgress;
      const lineWidth = 5 * (1 - easedProgress);

      ctx.save();
      ctx.beginPath();

      // Draw 3 expanding lines for the shockwave effect
      for (let i = 0; i < 3; i++) {
        const waveRadius = radius + i * 20; // Stagger the lines
        ctx.moveTo(0, this.y - waveRadius);
        ctx.lineTo(this.canvas.width, this.y - waveRadius);
        ctx.moveTo(0, this.y + waveRadius);
        ctx.lineTo(this.canvas.width, this.y + waveRadius);
      }

      ctx.strokeStyle = shockwave.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = 15;
      ctx.shadowColor = shockwave.color;
      ctx.stroke();
      ctx.restore();
    });

    // Reset shadow and alpha for other elements
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
