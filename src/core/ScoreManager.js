// src/core/ScoreManager.js

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.judgements = {
      Perfect: 0,
      Good: 0,
      Bad: 0,
      Miss: 0,
    };
  }

  /**
   * Called when a note interaction occurs (hit, hold tick, etc.).
   * @param {string} judgement - The judgement category ('Perfect', 'Good', 'Bad', 'Miss').
   */
  onHit(judgement) {
    this.judgements[judgement]++;

    switch (judgement) {
      case 'Perfect':
        this.combo++;
        this.score += 1000 + this.combo * 10;
        break;
      case 'Good':
        this.combo++;
        this.score += 500 + this.combo * 5;
        break;
      case 'Bad':
        this.combo = 0;
        break;
      case 'Miss':
        this.combo = 0;
        break;
    }

    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
  }

  /**
   * A specific method for misses, which is just a wrapper around onHit.
   */
  onMiss() {
    this.onHit('Miss');
  }

  // This method is for continuous notes like holds and drags
  increaseCombo(amount) {
      this.combo += amount;
       if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
  }

  getScore() {
    return Math.floor(this.score);
  }

  getCombo() {
    return Math.floor(this.combo);
  }

  getMaxCombo() {
    return this.maxCombo;
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.judgements = {
      Perfect: 0,
      Good: 0,
      Bad: 0,
      Miss: 0,
    };
  }
}
