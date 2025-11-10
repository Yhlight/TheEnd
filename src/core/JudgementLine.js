export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.y = canvas.height * 0.8; // Position at 80% of the screen height
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.y);
    this.ctx.lineTo(this.canvas.width, this.y);

    // Style based on GameDesign.md
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00FFFF'; // A bright cyan glow

    this.ctx.stroke();

    // Reset shadow for other elements
    this.ctx.shadowBlur = 0;
  }
}
