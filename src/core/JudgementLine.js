export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.y = 0;

    // Breathing effect properties
    this.breatheAngle = 0;
    this.breatheSpeed = 0.02;

    // Flash effect properties
    this.flashDuration = 10; // Flash lasts for 10 frames
    this.flashTimer = 0;

    this.update();
  }

  update() {
    this.y = this.canvas.height * 0.8;
    this.breatheAngle += this.breatheSpeed;
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
  }

  /**
   * Triggers the flash animation.
   */
  flash() {
    this.flashTimer = this.flashDuration;
  }

  draw() {
    const isFlashing = this.flashTimer > 0;
    const flashProgress = this.flashTimer / this.flashDuration;

    // Breathing effect calculation
    const breatheEffect = Math.sin(this.breatheAngle) * 5; // Glow fluctuates by 5

    // Draw main line
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.y);
    this.ctx.lineTo(this.canvas.width, this.y);

    // Base style
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 10 + breatheEffect;
    this.ctx.shadowColor = '#00FFFF';

    // Enhance style when flashing
    if (isFlashing) {
      this.ctx.lineWidth = 3 + 4 * flashProgress; // Line gets thicker and then shrinks
      this.ctx.shadowBlur = 15 + 15 * flashProgress; // Brighter glow when flashing
    }

    this.ctx.stroke();

    // Draw shockwave effect when flashing
    if (isFlashing) {
      const shockwaveRadius = 50 * (1 - flashProgress);
      const shockwaveOpacity = flashProgress;

      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(0, 255, 255, ${shockwaveOpacity})`;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(
        0,
        this.y - shockwaveRadius / 2,
        this.canvas.width,
        shockwaveRadius
      );
    }

    // Reset shadow for other elements
    this.ctx.shadowBlur = 0;
  }
}
