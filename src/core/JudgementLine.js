export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.y = 0; // Will be calculated in update
    this.update(); // Initial calculation
  }

  update() {
    // Recalculate position based on current canvas height
    this.y = this.canvas.height * 0.8;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.y);
    this.ctx.lineTo(this.canvas.width, this.y);

    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00FFFF';

    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }
}
