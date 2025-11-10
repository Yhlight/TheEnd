// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';
import { FlickNote } from './FlickNote.js';

const BASE_SCROLL_TIME = 3000; // The time it takes for a note to fall at 1x speed

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, noteSpeed = 1) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.noteSpeed = noteSpeed;

    this.scrollTime = BASE_SCROLL_TIME / this.noteSpeed;

    this.notes = [];
    this.activeHolds = new Set();
    this.nextNoteIndex = 0;
  }

  update(gameTime) {
    const judgementLineY = this.judgementLine.y;
    while (
      this.nextNoteIndex < this.chart.notes.length &&
      gameTime >= (this.chart.notes[this.nextNoteIndex].time - this.scrollTime)
    ) {
      const noteData = this.chart.notes[this.nextNoteIndex];
      let newNote = null;

      switch (noteData.type) {
        case 'hold':
          newNote = new HoldNote(this.canvas, noteData.x * this.canvas.width, judgementLineY, this.scrollTime, noteData);
          break;
        case 'flick':
          newNote = new FlickNote(this.canvas, noteData.x * this.canvas.width, judgementLineY, this.scrollTime, noteData);
          break;
        default: // 'tap' and any other type
          newNote = new TapNote(this.canvas, noteData.x * this.canvas.width, judgementLineY, this.scrollTime, noteData);
          break;
      }

      this.notes.push(newNote);
      this.nextNoteIndex++;
    }

    const missThreshold = 100;
    for (const note of this.notes) {
      if (!note.isMissed && note.y > missThreshold) {
        this.scoreManager.onMiss();
        note.markAsMissed();
      }
      note.update();
    }

    const holdReleaseWindow = 100;
    for (const note of this.notes) {
      if (note.type !== 'hold' || note.isMissed) continue;

      const noteEndTime = note.time + note.duration;

      if (note.isBeingHeld && this.activeHolds.has(note)) {
        if (gameTime > noteEndTime + holdReleaseWindow) {
          this.scoreManager.onHit();
          this.activeHolds.delete(note);
          note.isBeingHeld = false;
          this.notes = this.notes.filter(n => n !== note);
        }
      }
      else if (note.isBeingHeld && !this.activeHolds.has(note)) {
        const releaseTime = gameTime;
        if (Math.abs(releaseTime - noteEndTime) <= holdReleaseWindow) {
          this.scoreManager.onHit();
          note.isBeingHeld = false;
          this.notes = this.notes.filter(n => n !== note);
        } else {
          this.scoreManager.onMiss();
          note.markAsMissed();
        }
      }
    }

    this.notes = this.notes.filter(note => note.isAlive());
  }

  draw(ctx) {
    const judgementLineX = this.judgementLine.x;
    for (const note of this.notes) {
      note.draw(ctx, judgementLineX);
    }
  }

  checkTapHit() {
    const hitWindow = 75;
    let hitNote = null;
    let closestHittableNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || (note.type !== 'tap' && note.type !== 'flick')) continue;

      const dist = Math.abs(note.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestHittableNote = note;
      }
    }

    if (closestHittableNote && minDistance < hitWindow) {
      hitNote = closestHittableNote;
      this.notes = this.notes.filter(note => note !== hitNote);
    }

    return hitNote;
  }

  checkHoldStart() {
    const hitWindow = 75;
    let holdNoteStarted = null;
    let closestHoldNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'hold') continue;
      const dist = Math.abs(note.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestHoldNote = note;
      }
    }

    if (closestHoldNote && minDistance < hitWindow) {
      holdNoteStarted = closestHoldNote;
      holdNoteStarted.isBeingHeld = true;
      this.activeHolds.add(holdNoteStarted);
      this.scoreManager.increaseCombo();
    }

    return holdNoteStarted;
  }

  checkHoldEnd() {
    if (this.activeHolds.size > 0) {
      const holdNoteToEnd = this.activeHolds.values().next().value;
      this.activeHolds.delete(holdNoteToEnd);
    }
  }

  updateNoteSpeed(newSpeed) {
    this.noteSpeed = newSpeed;
    this.scrollTime = BASE_SCROLL_TIME / this.noteSpeed;
    const referenceY = this.judgementLine.y;
    for (const note of this.notes) {
      note.recalculateSpeed(this.scrollTime, referenceY);
    }
  }
}
