// src/core/BaseNote.js

export class BaseNote {
  constructor(canvas, x, judgementLineY, scrollTime, noteData, sizeMultiplier = 1) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.judgementLineY = judgementLineY;
    this.scrollTime = scrollTime; // Time in ms for a note to travel from spawn to judgement line

    this.noteData = noteData;
    this.time = noteData.time;
    this.x = noteData.x; // Normalized x position (0 to 1)

    this.y = 0; // This will be calculated in update()
    this.baseWidth = 100; // Store the original width
    this.baseHeight = 30; // Store the original height
    this.sizeMultiplier = sizeMultiplier;
    this.width = this.baseWidth * this.sizeMultiplier;
    this.height = this.baseHeight * this.sizeMultiplier;
    this.color = '#FFFFFF';

    this.isMissed = false;
    this.isBeingHeld = false; // For hold and drag notes

    this.spawnAnimationDuration = 200; // ms
    this.spawnTime = this.time - scrollTime;
    this.alpha = 0;
    this.scale = 0.5;
  }

  update(gameTime) {
    const timeUntilJudgement = this.time - gameTime;
    const progress = 1 - (timeUntilJudgement / this.scrollTime);

    // Calculate Y position based on time
    this.y = progress * this.judgementLineY;

    // Handle spawn animation
    const timeSinceSpawn = gameTime - this.spawnTime;
    if (timeSinceSpawn < this.spawnAnimationDuration) {
        const animationProgress = timeSinceSpawn / this.spawnAnimationDuration;
        this.alpha = animationProgress; // Fade in
        this.scale = 0.5 + animationProgress * 0.5; // Scale from 0.5 to 1.0
    } else {
        this.alpha = 1.0;
        this.scale = 1.0;
    }
  }

  markAsMissed() {
    this.isMissed = true;
  }

  markAsHit() {
    // By setting isMissed to true, we ensure the note is removed by the isAlive() check.
    // This is a bit of a misnomer, but it's the simplest way to hook into the existing removal logic.
    this.isMissed = true;
  }

  isAlive() {
    return !this.isMissed;
  }

  draw(ctx, judgementLineX) {
    throw new Error("Draw method must be implemented by subclass");
  }

  setSizeMultiplier(multiplier) {
    this.sizeMultiplier = multiplier;
    this.width = this.baseWidth * this.sizeMultiplier;
    this.height = this.baseHeight * this.sizeMultiplier;
  }
}
