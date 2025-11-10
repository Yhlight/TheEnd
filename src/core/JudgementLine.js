export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.y = canvas.height * 0.8; // Default Y position
    this.rotation = 0; // in degrees

    // Breathing effect properties
    this.breatheAngle = 0;
    this.breatheSpeed = 0.02;

    // Flash effect properties
    this.flashDuration = 10; // Flash lasts for 10 frames
    this.flashTimer = 0;

    this.update();
  }

  update() {
    // Y position is now controlled externally by JudgementLineManager
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

    // Breathing effect: affects both line width and glow
    const breatheEffect = Math.sin(this.breatheAngle);
    const baseLineWidth = 2;
    const baseShadowBlur = 5;

    this.ctx.save();

    // Move to the line's position and rotate the canvas
    this.ctx.translate(this.canvas.width / 2, this.y);
    this.ctx.rotate(this.rotation * Math.PI / 180);

    // --- Draw main line ---
    // Now we draw relative to the new (0,0) center
    this.ctx.beginPath();
    this.ctx.moveTo(-this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, 0);

    // Base style with subtle glow
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.shadowColor = '#FFFFFF';
    this.ctx.lineWidth = baseLineWidth + breatheEffect * 0.5;
    this.ctx.shadowBlur = baseShadowBlur + breatheEffect * 2;

    // Flash effect: burst of color, width, and glow
    if (isFlashing) {
      this.ctx.strokeStyle = '#FF0000';
      this.ctx.shadowColor = '#FF0000';
      this.ctx.lineWidth = 4 + 3 * flashProgress;
      this.ctx.shadowBlur = 10 + 10 * flashProgress;
    }

    this.ctx.stroke();

    // --- Draw shockwave effect when flashing ---
    if (isFlashing) {
      const shockwaveDistance = 40 * (1 - flashProgress);
      const shockwaveOpacity = flashProgress;

      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(255, 0, 0, ${shockwaveOpacity})`;
      this.ctx.shadowColor = `rgba(255, 0, 0, ${shockwaveOpacity})`;
      this.ctx.shadowBlur = 10;
      this.ctx.lineWidth = 2;

      // Draw shockwave lines relative to the new center
      this.ctx.moveTo(-this.canvas.width / 2, -shockwaveDistance);
      this.ctx.lineTo(this.canvas.width / 2, -shockwaveDistance);
      this.ctx.moveTo(-this.canvas.width / 2, shockwaveDistance);
      this.ctx.lineTo(this.canvas.width / 2, shockwaveDistance);

      this.ctx.stroke();
    }

    // Restore the canvas to its original state
    this.ctx.restore();

    // Reset shadow for other elements
    this.ctx.shadowBlur = 0;
  }
}
