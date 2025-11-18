// src/core/notes/BaseNote.js

/**
 * Base class for all note types.
 * Contains common properties and logic like state, timing, and basic rendering.
 */
export class BaseNote {
  constructor(noteData) {
    this.id = noteData.id;
    this.time = noteData.time; // in ms
    this.x = noteData.x; // 0 (left) to 1 (right)
    this.type = noteData.type;

    this.isJudged = false;
    this.isMissed = false;
    this.judgement = null; // e.g., 'perfect', 'good'
    this.judgementTime = 0;

    // For rendering
    this.renderX = 0;
    this.renderY = 0;
    this.alpha = 1.0;
    this.scale = 1.0;
  }

  /**
   * Checks if the note is still active (i.e., should be rendered and updated).
   * @param {number} gameTime - The current time in milliseconds.
   * @param {number} missThreshold - The time in ms after which a note is considered missed.
   * @returns {boolean}
   */
  isAlive(gameTime, missThreshold) {
    // A note is no longer alive if it has been missed or if it was hit long ago
    if (this.isMissed) return false;
    if (this.isJudged && (gameTime - this.judgementTime > 500)) return false; // Remove 500ms after judgement
    if (!this.isJudged && (gameTime > this.time + missThreshold)) return false;

    return true;
  }

  /**
   * Marks a note as hit with a specific judgement.
   * @param {string} judgement - The judgement ('perfect', 'good').
   * @param {number} gameTime - The time of the judgement.
   */
  judge(judgement, gameTime) {
    this.isJudged = true;
    this.judgement = judgement;
    this.judgementTime = gameTime;
  }

  /**
   * Marks a note as missed.
   */
  miss() {
    this.isMissed = true;
    this.isJudged = true;
    this.judgement = 'miss';
  }

  /**
   * Updates the note's rendering properties based on game time.
   * @param {number} gameTime - The current time in milliseconds.
   * @param {number} noteSpeed - The user-defined note speed setting.
   * @param {number} noteSize - The user-defined note size multiplier (e.g., 1.0 for default).
   */
  update(gameTime, noteSpeed, noteSize = 1.0) {
    const timeUntilHit = this.time - gameTime;
    const fallDistance = timeUntilHit * noteSpeed;

    // This is the note's y-position relative to the judgement line.
    // The actual drawing will happen in a transformed canvas context.
    this.renderY = -fallDistance;

    // Spawn animation
    const spawnTime = 200; // ms for the note to fade/scale in
    const timeSinceSpawn = gameTime - (this.time - noteSpeed * 1000); // A rough estimate of when it appeared

    if (timeSinceSpawn < spawnTime) {
      const progress = timeSinceSpawn / spawnTime;
      this.alpha = progress;
      this.scale = (0.5 + progress * 0.5) * noteSize;
    } else {
      this.alpha = 1.0;
      this.scale = noteSize;
    }

    if (this.isJudged && this.judgement !== 'miss') {
      // Disappear animation after being hit
      const timeSinceJudged = gameTime - this.judgementTime;
      const fadeOutDuration = 100;
      if (timeSinceJudged < fadeOutDuration) {
        this.alpha = 1.0 - (timeSinceJudged / fadeOutDuration);
      } else {
        this.alpha = 0;
      }
    }
  }

  /**
   * A helper to apply a standard glow effect for notes.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {string} color - The color of the glow.
   */
  applyGlow(ctx, color) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
  }

  /**
   * Draws the note on the canvas. This method should be overridden by subclasses.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   */
  draw(ctx) {
    // Base implementation does nothing, but subclasses should call applyGlow.
  }
}
