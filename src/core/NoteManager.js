// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, scrollTime = 1500) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.scrollTime = scrollTime;
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

      // Case 1: Player is still holding the note
      if (note.isBeingHeld && this.activeHolds.has(note)) {
        if (gameTime > noteEndTime + holdReleaseWindow) {
          // Player held on for too long, treat as a successful release at the end time
          this.scoreManager.onHit(); // << Score for successful hold completion
          this.activeHolds.delete(note);
          note.isBeingHeld = false; // Mark as complete
          this.notes = this.notes.filter(n => n !== note); // Remove from game
        }
      }
      // Case 2: Player released the note
      else if (note.isBeingHeld && !this.activeHolds.has(note)) {
        const releaseTime = gameTime; // Approximately
        if (Math.abs(releaseTime - noteEndTime) <= holdReleaseWindow) {
          // Successful release
          this.scoreManager.onHit(); // << Score for successful hold completion
          note.isBeingHeld = false;
          this.notes = this.notes.filter(n => n !== note);
        } else {
          // Premature or late release
          this.scoreManager.onMiss();
          note.markAsMissed();
        }
      }
    }

    // Remove notes whose animations have finished
    this.notes = this.notes.filter(note => note.isAlive());
  }

  draw(ctx) {
    const judgementLineX = this.judgementLine.x;
    for (const note of this.notes) {
      note.draw(ctx, judgementLineX);
    }
  }

  // Checks for tap note hits
  checkTapHit() {
    const hitWindow = 75;
    let hitNote = null;

    // Find the closest, hittable tap note
    let closestTapNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'tap') continue;
      const dist = Math.abs(note.y); // Simplified distance check
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

  // Checks for the start of a hold note
  checkHoldStart() {
    const hitWindow = 75;
    let holdNoteStarted = null;

    // Find the closest, hittable hold note
    let closestHoldNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'hold') continue;
      const dist = Math.abs(note.y); // Simplified distance check
      if (dist < minDistance) {
        minDistance = dist;
        closestHoldNote = note;
      }
    }

    if (closestHoldNote && minDistance < hitWindow) {
      holdNoteStarted = closestHoldNote;
      holdNoteStarted.isBeingHeld = true; // Set the state on the note itself
      this.activeHolds.add(holdNoteStarted);
      this.scoreManager.increaseCombo(); // Increase combo for the start of the hold
    }

    return holdNoteStarted;
  }

  // Called when a touch/click is released
  checkHoldEnd() {
    // Simply remove the oldest active hold. The update loop will handle scoring/missing.
    if (this.activeHolds.size > 0) {
      const holdNoteToEnd = this.activeHolds.values().next().value;
      this.activeHolds.delete(holdNoteToEnd);
    }
  }
}
