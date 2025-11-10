export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.y = 0;

    // Flash effect properties
    this.flashDuration = 10; // Flash lasts for 10 frames
    this.flashTimer = 0;

    this.update();
  }

  update() {
    this.y = this.canvas.height * 0.8;
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

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.y);
    this.ctx.lineTo(this.canvas.width, this.y);

    // Base style
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00FFFF';

    // Enhance style when flashing
    if (isFlashing) {
      this.ctx.lineWidth = 3 + 4 * flashProgress; // Line gets thicker and then shrinks
      this.ctx.shadowBlur = 10 + 15 * flashProgress;
    }

    this.ctx.stroke();

    // Reset shadow for other elements
    this.ctx.shadowBlur = 0;
  }
}
