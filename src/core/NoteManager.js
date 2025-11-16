// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';
import { FlickNote } from './FlickNote.js';
import { DragNote } from './DragNote.js';
import { CatchNote } from './CatchNote.js';

const BASE_SCROLL_TIME = 3000;

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, audioManager, effectManager, settings, spirit) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.audioManager = audioManager;
    this.effectManager = effectManager;
    this.settings = settings;
    this.spirit = spirit;
    this.scrollTime = BASE_SCROLL_TIME / this.settings.noteSpeed;
    this.noteSizeMultiplier = this.settings.noteSize || 1;

    this.notes = [];
    this.activeHolds = new Set();
    this.activeDragNote = null;
    this.nextNoteIndex = 0;
  }

  setNoteSpeed(newSpeed) {
    this.settings.noteSpeed = newSpeed;
    this.scrollTime = BASE_SCROLL_TIME / this.settings.noteSpeed;
  }

  setNoteSize(newSize) {
    this.noteSizeMultiplier = newSize;
    // Apply the new size to all existing notes
    for (const note of this.notes) {
      note.setSizeMultiplier(newSize);
    }
  }

  loadChart(newChart) {
    this.chart = newChart;
    this.notes = [];
    this.activeHolds.clear();
    this.activeDragNote = null;
    this.nextNoteIndex = 0;

    if (newChart) {
        this.notes = newChart.notes.map(noteData => {
            const commonArgs = [this.canvas, 0, this.judgementLine.y, this.scrollTime, noteData, this.noteSizeMultiplier];
            switch (noteData.type) {
                case 'hold': return new HoldNote(...commonArgs);
                case 'flick': return new FlickNote(...commonArgs);
                case 'drag': return new DragNote(...commonArgs);
                case 'catch': return new CatchNote(...commonArgs);
                default: return new TapNote(...commonArgs);
            }
        });

        if (newChart.lineEvents) {
            this.judgementLine.loadEvents(newChart.lineEvents);
        } else {
            this.judgementLine.loadEvents([]);
        }
    }
  }

  update(gameTime, dt) {
    if (!this.chart) return;

    for (const note of this.notes) {
      note.update(gameTime, dt);
      const missThreshold = this.judgementLine.y + 100;
      if (!note.isMissed && !note.isBeingHeld && note.y > missThreshold) {
          this.scoreManager.onMiss();
          note.markAsMissed();
          this.audioManager.playSound('miss');
          this.spirit.onMiss();
          const missX = this.canvas.width / 2;
          const missY = this.judgementLine.y - 50;
          this.effectManager.createJudgementText(missX, missY, 'Miss', '#FF8080');
      }
    }

    this.activeHolds.forEach(holdNote => {
      const endTime = holdNote.time + holdNote.duration;
      if (gameTime >= endTime) {
        this.scoreManager.onHit('Perfect');
        holdNote.isAlive = () => false;
        this.activeHolds.delete(holdNote);
      } else {
        this.scoreManager.increaseCombo(0.2);
        this.scoreManager.score += 2;
      }
    });

    if (this.activeDragNote) {
      const endTime = this.activeDragNote.time + this.activeDragNote.duration;
      if (gameTime >= endTime) {
        this.scoreManager.onHit('Perfect');
        this.activeDragNote.isAlive = () => false;
        this.activeDragNote = null;
      }
    }

    this.notes = this.notes.filter(note => note.isAlive());
  }

  draw(ctx, judgementLineX) {
    for (const note of this.notes) {
      note.draw(ctx, judgementLineX);
    }
  }

  static judgementWindows = {
    Perfect: 40,
    Good: 80,
    Bad: 120,
  };

  _findClosestNote(gameTime, clickX, clickY, noteType) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    // 1. Find the note that is temporally closest within the widest judgement window.
    for (const note of this.notes) {
        if (note.isMissed || (noteType && note.type !== noteType)) continue;

        const timeDiff = Math.abs(adjustedTime - note.time);

        if (timeDiff < NoteManager.judgementWindows.Bad && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    // 2. If a temporally close note is found, THEN check the spatial conditions.
    if (closestNote) {
        const yTolerance = 100; // Vertical tolerance zone around the judgement line
        if (Math.abs(clickY - this.judgementLine.y) > yTolerance) {
            return null; // Click was too far vertically from the line
        }

        const notePixelX = (this.canvas.width / 2) + (closestNote.x - 0.5) * this.canvas.width;
        const xTolerance = closestNote.width / 2;

        if (Math.abs(clickX - notePixelX) > xTolerance) {
            return null; // Click was too far horizontally from the note's center
        }

        // 3. If both time and space are valid, return the note and its timing difference.
        return { note: closestNote, timeDiff: minTimeDiff };
    }

    return null;
  }

  _getJudgement(timeDiff) {
    if (timeDiff <= NoteManager.judgementWindows.Perfect) return 'Perfect';
    if (timeDiff <= NoteManager.judgementWindows.Good) return 'Good';
    return 'Bad';
  }

  checkTapHit(gameTime, clickX, clickY) {
    const result = this._findClosestNote(gameTime, clickX, clickY, 'tap');
    if (result && result.note.hit) { // Check if the note has a 'hit' method
      result.note.hit(); // Mark the note as hit to trigger its animation
      const judgement = this._getJudgement(result.timeDiff);
      // The note is not removed from this.notes here.
      // It will be removed naturally when its isAlive() returns false after the animation.
      return { note: result.note, judgement };
    }
    return null;
  }

  checkFlickHit(gameTime, clickX, clickY, velocity) {
    const FLICK_VELOCITY_THRESHOLD = 5;
    const result = this._findClosestNote(gameTime, clickX, clickY, 'flick');

    if (result && Math.abs(velocity) > FLICK_VELOCITY_THRESHOLD) {
        const judgement = this._getJudgement(result.timeDiff);
        this.notes = this.notes.filter(note => note !== result.note);
        return { note: result.note, judgement };
    }
    return null;
  }

  checkHoldStart(gameTime, clickX, clickY) {
    const result = this._findClosestNote(gameTime, clickX, clickY, 'hold');
    if (result) {
        const judgement = this._getJudgement(result.timeDiff);
        result.note.isBeingHeld = true;
        this.activeHolds.add(result.note);
        return { note: result.note, judgement };
    }
    return null;
  }

  checkHoldEnd() {
    if (this.activeHolds.size > 0) {
       this.activeHolds.forEach(holdNote => {
         this.scoreManager.onMiss();
         holdNote.markAsMissed();
       });
       this.activeHolds.clear();
    }
  }

  checkDragStart(gameTime, clickX, clickY) {
    if (this.activeDragNote) return null;
    const result = this._findClosestNote(gameTime, clickX, clickY, 'drag');

    if (result) {
        const judgement = this._getJudgement(result.timeDiff);
        result.note.isBeingHeld = true;
        this.activeDragNote = result.note;
        return { note: result.note, judgement };
    }
    return null;
  }

  checkDragUpdate(pointerX) {
    if (!this.activeDragNote) return;

    const notePixelX = (this.canvas.width / 2) + this.judgementLine.x + (this.activeDragNote.x - 0.5) * this.canvas.width;
    const hitBoxWidth = this.activeDragNote.width * 2;

    if (Math.abs(pointerX - notePixelX) > hitBoxWidth / 2) {
      this.scoreManager.onMiss();
      this.activeDragNote.markAsMissed();
      this.activeDragNote = null;
    } else {
      this.scoreManager.increaseCombo(0.2);
    }
  }

  checkDragEnd() {
    if (this.activeDragNote) {
      this.scoreManager.onMiss();
      this.activeDragNote.markAsMissed();
      this.activeDragNote = null;
    }
  }

  isChartFinished() {
    return this.notes.length === 0 && this.activeHolds.size === 0 && this.activeDragNote === null;
  }

  getCurrentChart() {
    return this.chart;
  }

  checkCatchHit(gameTime, clickX, clickY) {
    // For catch notes, we only care about the time, not the position.
    const adjustedTime = gameTime - this.settings.offset;
    let closestNote = null;
    let minTimeDiff = Infinity;

    for (const note of this.notes) {
        if (note.isMissed || note.type !== 'catch') continue;

        const timeDiff = Math.abs(adjustedTime - note.time);

        if (timeDiff < NoteManager.judgementWindows.Bad && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    if (closestNote) {
      const judgement = this._getJudgement(minTimeDiff);
      this.notes = this.notes.filter(note => note !== closestNote);
      return { note: closestNote, judgement };
    }
    return null;
  }
}
