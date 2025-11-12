// src/core/ScoreManager.js

export class ScoreManager {
  constructor(effectManager) {
    this.effectManager = effectManager;
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

  onHit(judgement) {
    this.judgements[judgement]++;
    const oldCombo = this.combo;

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

    const COMBO_MILESTONE = 50;
    if (this.combo > 0 && Math.floor(this.combo / COMBO_MILESTONE) > Math.floor(oldCombo / COMBO_MILESTONE)) {
        if (this.effectManager) {
            this.effectManager.createComboMilestoneEffect(this.combo);
        }
    }
  }

  onMiss() {
    this.onHit('Miss');
  }

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
    return Math.floor(this.maxCombo);
  }

  getJudgementCounts() {
    return this.judgements;
  }

  getAccuracy() {
    const totalJudgements = this.judgements.Perfect + this.judgements.Good + this.judgements.Bad + this.judgements.Miss;
    if (totalJudgements === 0) {
      return 100;
    }
    const weightedScore = this.judgements.Perfect * 1.0 + this.judgements.Good * 0.5;
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
