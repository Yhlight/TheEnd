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

  getJudgementCounts() {
    return this.judgements;
  }

  getAccuracy() {
    const totalNotes = Object.values(this.judgements).reduce((a, b) => a + b, 0);
    if (totalNotes === 0) {
      return 100;
    }

    // Perfects count as 100%, Goods as 50%
    const weightedScore = this.judgements.Perfect * 1.0 + this.judgements.Good * 0.5;

    // Bads and Misses don't contribute to the numerator, but do to the denominator.
    // However, hold/drag ticks might add combo but don't have a judgement.
    // Let's base accuracy on judgements only.
    const totalJudgements = this.judgements.Perfect + this.judgements.Good + this.judgements.Bad + this.judgements.Miss;

    if (totalJudgements === 0) {
      return 100;
    }

    const accuracy = (weightedScore / totalJudgements) * 100;
    return accuracy;
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
