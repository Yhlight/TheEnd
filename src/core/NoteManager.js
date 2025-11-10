// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';

const BASE_SCROLL_TIME = 3000; // The time it takes for a note to fall at 1x speed

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, noteSpeed = 1) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.noteSpeed = noteSpeed;

    // Calculate the actual scroll time based on the speed
    this.scrollTime = BASE_SCROLL_TIME / this.noteSpeed;

    this.notes = [];
    this.activeHolds = new Set(); // Tracks notes currently being held down
    this.nextNoteIndex = 0;
  }

  update(gameTime) {
    const judgementLineY = this.judgementLine.y;
    // Spawn new notes ahead of time
    while (
      this.nextNoteIndex < this.chart.notes.length &&
      gameTime >= (this.chart.notes[this.nextNoteIndex].time - this.scrollTime)
    ) {
      const noteData = this.chart.notes[this.nextNoteIndex];
      let newNote = null;

      // Pass the calculated scrollTime to each new note
      if (noteData.type === 'hold') {
        newNote = new HoldNote(this.canvas, noteData.x * this.canvas.width, judgementLineY, this.scrollTime, noteData);
      } else { // Default to tap note
        newNote = new TapNote(this.canvas, noteData.x * this.canvas.width, judgementLineY, this.scrollTime, noteData);
      }

      this.notes.push(newNote);
      this.nextNoteIndex++;
    }

    // Update all active notes and mark missed ones
    const missThreshold = 100; // Miss if it goes 100px past the line
    for (const note of this.notes) {
      if (!note.isMissed && note.y > missThreshold) {
        this.scoreManager.onMiss();
        note.markAsMissed();
      }
      note.update();
    }

    // --- Hold Note Logic ---
    const holdReleaseWindow = 100; // Can release 100ms early/late

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
    let closestTapNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'tap') continue;
      const dist = Math.abs(note.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestTapNote = note;
      }
    }

    if (closestTapNote && minDistance < hitWindow) {
      hitNote = closestTapNote;
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

    // Recalculate speed for all active notes
    // We use the initial judgement line Y as a consistent reference for distance.
    const referenceY = this.judgementLine.y;
    for (const note of this.notes) {
      note.recalculateSpeed(this.scrollTime, referenceY);
    }
  }
}
