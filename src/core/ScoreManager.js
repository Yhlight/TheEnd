// src/core/ScoreManager.js

const SCORE_VALUES = {
  perfect: 1000,
  good: 500,
  miss: 0,
};

/**
 * Manages the player's score, combo, and other performance metrics.
 */
export class ScoreManager {
  constructor(totalNotes) {
    this.totalNotes = totalNotes;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.judgements = {
      perfect: 0,
      good: 0,
      miss: 0,
    };
  }

  /**
   * Resets all scoring metrics to their initial state.
   */
  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.judgements = {
      perfect: 0,
      good: 0,
      miss: 0,
    };
  }

  /**
   * Applies a judgement to the score.
   * @param {string} judgement - The judgement ('perfect', 'good', 'miss').
   */
  addJudgement(judgement) {
    if (judgement === 'miss') {
      this.combo = 0;
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
    }

    this.judgements[judgement]++;
    this.score += SCORE_VALUES[judgement] * (1 + this.combo * 0.01); // Combo bonus
  }

  /**
   * Calculates the player's current accuracy.
   * @returns {number} The accuracy from 0 to 100.
   */
  getAccuracy() {
    const totalJudgements = this.judgements.perfect + this.judgements.good + this.judgements.miss;
    if (totalJudgements === 0) return 100;

    const weightedScore = this.judgements.perfect * 1 + this.judgements.good * 0.5;
    const maxPossibleScore = totalJudgements * 1;

    return (weightedScore / maxPossibleScore) * 100;
  }

  /**
   * Gets the final results of the game.
   * @returns {object} An object containing all final scores and stats.
   */
  getResults() {
    return {
      score: Math.round(this.score),
      maxCombo: this.maxCombo,
      judgements: { ...this.judgements },
      accuracy: this.getAccuracy(),
      finalGrade: this.getGrade(),
    };
  }

  /**
   * Determines a letter grade based on accuracy.
   * @returns {string} The final letter grade.
   */
  getGrade() {
    const acc = this.getAccuracy();
    if (acc >= 100) return 'S+';
    if (acc >= 98) return 'S';
    if (acc >= 95) return 'A+';
    if (acc >= 90) return 'A';
    if (acc >= 85) return 'B';
    if (acc >= 80) return 'C';
    if (acc >= 70) return 'D';
    return 'F';
  }
}
