export class JudgementLine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.x = canvas.width / 2; // Default X position (center)
    this.y = canvas.height * 0.8; // Default Y position
    this.rotation = 0; // in degrees
    this.alpha = 1.0; // apha, for fade in/out animations

    // Breathing effect properties
    this.breatheAngle = 0;
    this.breatheSpeed = 0.02;

    // Flash effect properties
    this.flashDuration = 10; // Flash lasts for 10 frames
    this.flashTimer = 0;
  }

  update() {
    // aniamtions are now controlled externally by JudgementLineManager
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
    // The canvas is already transformed by GameStage.vue.
    // This component draws itself centered at the origin (0,0).
    // The alpha is also handled externally.

    const isFlashing = this.flashTimer > 0;
    const flashProgress = this.flashTimer / this.flashDuration;
    const breatheEffect = Math.sin(this.breatheAngle);

    // --- Draw main line at y=0 ---
    this.ctx.beginPath();
    // The line should span a very large width to avoid being clipped when rotated.
    this.ctx.moveTo(-this.canvas.width * 2, 0);
    this.ctx.lineTo(this.canvas.width * 2, 0);

    // Base style
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.shadowColor = '#FFFFFF';
    this.ctx.lineWidth = 2 + breatheEffect * 0.5;
    this.ctx.shadowBlur = 5 + breatheEffect * 2;
    this.ctx.globalAlpha = this.alpha;

    // Flash style
    if (isFlashing) {
      this.ctx.strokeStyle = '#FF0000';
      this.ctx.shadowColor = '#FF0000';
      this.ctx.lineWidth = 4 + 3 * flashProgress;
      this.ctx.shadowBlur = 10 + 10 * flashProgress;
    }
    this.ctx.stroke();

    // --- Draw shockwave at y=0 ---
    if (isFlashing) {
      const shockwaveDistance = 40 * (1 - flashProgress);
      const shockwaveOpacity = flashProgress;
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(255, 0, 0, ${shockwaveOpacity})`;
      this.ctx.shadowColor = `rgba(255, 0, 0, ${shockwaveOpacity})`;
      this.ctx.shadowBlur = 10;
      this.ctx.lineWidth = 2;
      this.ctx.moveTo(-this.canvas.width * 2, -shockwaveDistance);
      this.ctx.lineTo(this.canvas.width * 2, -shockwaveDistance);
      this.ctx.moveTo(-this.canvas.width * 2, shockwaveDistance);
      this.ctx.lineTo(this.canvas.width * 2, shockwaveDistance);
      this.ctx.stroke();
    }

    // Reset shadow and alpha for other draw calls
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1.0;
  }
}
