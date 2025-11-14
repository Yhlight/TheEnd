// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';
import { FlickNote } from './FlickNote.js';
import { DragNote } from './DragNote.js';
import { CatchNote } from './CatchNote.js';

const BASE_SCROLL_TIME = 3000;

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, audioManager, effectManager, settings) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.audioManager = audioManager;
    this.effectManager = effectManager;
    this.settings = settings;
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

  update(gameTime) {
    if (!this.chart) return;

    for (const note of this.notes) {
      note.update(gameTime);
      const missThreshold = this.judgementLine.y + 100;
      if (!note.isMissed && !note.isBeingHeld && note.y > missThreshold) {
          this.scoreManager.onMiss();
          note.markAsMissed();
          this.audioManager.playMissSound();
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

  checkTapHit(gameTime, clickX, clickY) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'tap') continue;

      const timeDiff = Math.abs(adjustedTime - note.time);

      // 1. Check if the tap is vertically close to the judgement line
      if (Math.abs(clickY - this.judgementLine.y) > 100) continue;

      // 2. Check if the note is temporally close to being hit
      if (timeDiff > NoteManager.judgementWindows.Bad) continue;

      const notePixelX = this.judgementLine.x + (note.x - 0.5) * this.canvas.width;
      const distanceX = Math.abs(clickX - notePixelX);

      // 3. Check if the tap is horizontally close enough to the note
      if (distanceX < note.width / 2 && timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestNote = note;
      }
    }

    if (closestNote) {
      let judgement = 'Bad';
      if (minTimeDiff <= NoteManager.judgementWindows.Good) judgement = 'Good';
      if (minTimeDiff <= NoteManager.judgementWindows.Perfect) judgement = 'Perfect';
      this.notes = this.notes.filter(note => note !== closestNote);
      return { note: closestNote, judgement };
    }
    return null;
  }

  checkFlickHit(gameTime, clickX, clickY, velocity) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;
    const FLICK_VELOCITY_THRESHOLD = 5;

    for (const note of this.notes) {
        if (note.isMissed || note.type !== 'flick') continue;

        const timeDiff = Math.abs(adjustedTime - note.time);
        if (Math.abs(clickY - this.judgementLine.y) > 100) continue;
        if (timeDiff > NoteManager.judgementWindows.Bad) continue;

        const notePixelX = this.judgementLine.x + (note.x - 0.5) * this.canvas.width;
        const distanceX = Math.abs(clickX - notePixelX);

        if (distanceX < note.width / 2 && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    if (closestNote && Math.abs(velocity) > FLICK_VELOCITY_THRESHOLD) {
        let judgement = 'Bad';
        if (minTimeDiff <= NoteManager.judgementWindows.Good) judgement = 'Good';
        if (minTimeDiff <= NoteManager.judgementWindows.Perfect) judgement = 'Perfect';
        this.notes = this.notes.filter(note => note !== closestNote);
        return { note: closestNote, judgement };
    }
    return null;
  }

  checkHoldStart(gameTime, clickX, clickY) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
        if (note.isMissed || note.type !== 'hold') continue;

        const timeDiff = Math.abs(adjustedTime - note.time);
        if (Math.abs(clickY - this.judgementLine.y) > 100) continue;
        if (timeDiff > NoteManager.judgementWindows.Bad) continue;

        const notePixelX = this.judgementLine.x + (note.x - 0.5) * this.canvas.width;
        const distanceX = Math.abs(clickX - notePixelX);

        if (distanceX < note.width / 2 && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    if (closestNote) {
        let judgement = 'Bad';
        if (minTimeDiff <= NoteManager.judgementWindows.Good) judgement = 'Good';
        if (minTimeDiff <= NoteManager.judgementWindows.Perfect) judgement = 'Perfect';
        closestNote.isBeingHeld = true;
        this.activeHolds.add(closestNote);
        return { note: closestNote, judgement };
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

    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
        if (note.isMissed || note.type !== 'drag') continue;

        const timeDiff = Math.abs(adjustedTime - note.time);
        if (Math.abs(clickY - this.judgementLine.y) > 100) continue;
        if (timeDiff > NoteManager.judgementWindows.Bad) continue;

        const notePixelX = this.judgementLine.x + (note.x - 0.5) * this.canvas.width;
        const distanceX = Math.abs(clickX - notePixelX);

        if (distanceX < note.width / 2 && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    if (closestNote) {
        let judgement = 'Bad';
        if (minTimeDiff <= NoteManager.judgementWindows.Good) judgement = 'Good';
        if (minTimeDiff <= NoteManager.judgementWindows.Perfect) judgement = 'Perfect';
        closestNote.isBeingHeld = true;
        this.activeDragNote = closestNote;
        return { note: closestNote, judgement };
    }
    return null;
  }

  checkDragUpdate(pointerX) {
    if (!this.activeDragNote) return;

    const notePixelX = this.judgementLine.x + (this.activeDragNote.x - 0.5) * this.canvas.width;
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

  checkCatchHit(gameTime, clickX, clickY) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'catch') continue;

      const timeDiff = Math.abs(adjustedTime - note.time);

      if (Math.abs(clickY - this.judgementLine.y) > 100) continue;
      if (timeDiff > NoteManager.judgementWindows.Bad) continue;

      const notePixelX = this.judgementLine.x + (note.x - 0.5) * this.canvas.width;
      const distanceX = Math.abs(clickX - notePixelX);

      if (distanceX < note.width / 2 && timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestNote = note;
      }
    }

    if (closestNote) {
      let judgement = 'Bad';
      if (minTimeDiff <= NoteManager.judgementWindows.Good) judgement = 'Good';
      if (minTimeDiff <= NoteManager.judgementWindows.Perfect) judgement = 'Perfect';
      this.notes = this.notes.filter(note => note !== closestNote);
      return { note: closestNote, judgement };
    }
    return null;
  }
}
