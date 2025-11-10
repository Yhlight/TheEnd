export class Note {
  constructor(canvas, x, judgementLineY, scrollTime) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Position and dimensions
    this.x = x;
    this.y = 0; // Start from the top
    this.width = 100;
    this.height = 30;
    this.color = '#FF00FF';

    // Movement: Calculate speed needed to arrive at the judgement line in exactly scrollTime ms
    // Speed = Distance / Time. Time is in frames, so convert scrollTime from ms.
    const distance = judgementLineY;
    const timeInSeconds = scrollTime / 1000;
    const frames = timeInSeconds * 60; // Assuming 60 FPS
    this.speed = distance / frames;
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    this.ctx.fillStyle = this.color;
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = this.color;

    this.ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    this.ctx.shadowBlur = 0;
  }
}
