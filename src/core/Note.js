export class Note {
  constructor(canvas, x) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Position and dimensions
    this.x = x;
    this.y = 0; // Start from the top
    this.width = 100;
    this.height = 30;

    // Movement
    this.speed = 5; // Pixels per frame
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    this.ctx.fillStyle = '#FF00FF'; // A bright magenta for visibility
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = '#FF00FF';

    this.ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }
}
