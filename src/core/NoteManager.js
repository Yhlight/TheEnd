// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';
import { FlickNote } from './FlickNote.js';
import { DragNote } from './DragNote.js';

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

    this.notes = [];
    this.activeHolds = new Set();
    this.activeDragNote = null;
    this.nextNoteIndex = 0;
  }

  setNoteSpeed(newSpeed) {
    this.settings.noteSpeed = newSpeed;
    this.scrollTime = BASE_SCROLL_TIME / this.settings.noteSpeed;
  }

  loadChart(newChart) {
    this.chart = newChart;
    this.notes = [];
    this.activeHolds.clear();
    this.activeDragNote = null;
    this.nextNoteIndex = 0;

    if (newChart) {
        // Instantiate all notes at once for the editor
        this.notes = newChart.notes.map(noteData => {
            const judgementLineY = this.judgementLine.y;
            switch (noteData.type) {
                case 'hold': return new HoldNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData);
                case 'flick': return new FlickNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData);
                case 'drag': return new DragNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData);
                default: return new TapNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData);
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

    // The note spawning logic is removed as notes are pre-loaded.
    // We just need to update their positions.
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

  checkTapHit(gameTime) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
      if (note.isMissed || (note.type !== 'tap' && note.type !== 'flick')) continue;

      const timeDiff = Math.abs(adjustedTime - note.time);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestNote = note;
      }
    }

    if (closestNote && minTimeDiff <= NoteManager.judgementWindows.Bad) {
      let judgement = 'Bad';
      if (minTimeDiff <= NoteManager.judgementWindows.Good) judgement = 'Good';
      if (minTimeDiff <= NoteManager.judgementWindows.Perfect) judgement = 'Perfect';
      this.notes = this.notes.filter(note => note !== closestNote);
      return { note: closestNote, judgement };
    }
    return null;
  }

  checkHoldStart(gameTime) {
    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
        if (note.isMissed || note.type !== 'hold') continue;
        const timeDiff = Math.abs(adjustedTime - note.time);
        if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    if (closestNote && minTimeDiff <= NoteManager.judgementWindows.Bad) {
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

  checkDragStart(gameTime) {
    if (this.activeDragNote) return null;

    let closestNote = null;
    let minTimeDiff = Infinity;
    const adjustedTime = gameTime - this.settings.offset;

    for (const note of this.notes) {
        if (note.isMissed || note.type !== 'drag') continue;
        const timeDiff = Math.abs(adjustedTime - note.time);
        if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestNote = note;
        }
    }

    if (closestNote && minTimeDiff <= NoteManager.judgementWindows.Bad) {
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
    const hitBoxWidth = this.activeDragNote.width * 2;
    const noteCenterX = this.activeDragNote.x;

    if (Math.abs(pointerX - noteCenterX) > hitBoxWidth / 2) {
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
}
