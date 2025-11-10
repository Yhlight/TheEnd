export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.x = canvas.width / 2;
    this.y = canvas.height * 0.8;
    this.rotation = 0;
    this.alpha = 1.0;

    this.breatheAngle = 0;
    this.breatheSpeed = 0.02;

    this.flashDuration = 20;
    this.flashTimer = 0;
    this.flashColor = '#FFFFFF';
  }

  update() {
    this.breatheAngle += this.breatheSpeed;
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
  }

  flash(color = '#FFFFFF') {
    this.flashTimer = this.flashDuration;
    this.flashColor = color;
  }

  draw() {
    const breatheEffect = Math.sin(this.breatheAngle);

    this.ctx.beginPath();
    this.ctx.moveTo(-this.canvas.width * 2, 0);
    this.ctx.lineTo(this.canvas.width * 2, 0);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.shadowColor = '#FFFFFF';
    this.ctx.lineWidth = 2 + breatheEffect * 0.5;
    this.ctx.shadowBlur = 5 + breatheEffect * 2;
    this.ctx.globalAlpha = this.alpha;
    this.ctx.stroke();

    if (this.flashTimer > 0) {
      const progress = 1 - (this.flashTimer / this.flashDuration);
      const shockwaveOpacity = 1 - progress;
      const lineCount = 3;
      const maxDistance = 80;

      for (let i = 0; i < lineCount; i++) {
        const distance = (progress * maxDistance) + (i * 20);
        const opacity = shockwaveOpacity * (1 - (distance / (maxDistance + lineCount * 20)));
        if (opacity <= 0) continue;

        const rgbColor = this.hexToRgb(this.flashColor);
        if (!rgbColor) continue;

        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;
        this.ctx.shadowColor = this.flashColor;
        this.ctx.shadowBlur = 10;
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(-this.canvas.width * 2, -distance);
        this.ctx.lineTo(this.canvas.width * 2, -distance);
        this.ctx.moveTo(-this.canvas.width * 2, distance);
        this.ctx.lineTo(this.canvas.width * 2, distance);
        this.ctx.stroke();
      }
    }

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1.0;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
};
