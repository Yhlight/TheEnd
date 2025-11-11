// src/core/ScoreManager.js

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
  }

  /**
   * Called when a note is successfully hit.
   */
  onHit() {
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    // Simple scoring: 100 points per hit, plus a combo bonus
    this.score += 100 + this.combo * 10;
  }

  /**
   * Called when a player misses a note or clicks at the wrong time.
   */
  onMiss() {
    this.combo = 0;
  }

  getScore() {
    return this.score;
  }

  getCombo() {
    return this.combo;
  }

  getMaxCombo() {
    return this.maxCombo;
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
  }
}
