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
    const missThreshold = 100;
    for (const note of this.notes) {
      if (!note.isMissed && note.y > judgementLineY + missThreshold) {
        this.scoreManager.onMiss();
        note.markAsMissed();
      }
      note.update(judgementLineY); // Pass judgement line's Y position
    }

    // Remove notes whose animations have finished
    this.notes = this.notes.filter(note => note.isAlive());
  }

  draw() {
    for (const note of this.notes) {
      note.draw();
    }
  }

  // Checks for tap note hits
  checkTapHit() {
    const hitWindow = 75;
    const judgementLineY = this.judgementLine.y;
    let hitNote = null;

    // Find the closest, hittable tap note
    let closestTapNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'tap') continue;
      const dist = Math.abs(note.y - judgementLineY);
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
    const judgementLineY = this.judgementLine.y;
    let holdNoteStarted = null;

    // Find the closest, hittable hold note
    let closestHoldNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'hold') continue;
      const dist = Math.abs(note.y - judgementLineY);
      if (dist < minDistance) {
        minDistance = dist;
        closestHoldNote = note;
      }
    }

    if (closestHoldNote && minDistance < hitWindow) {
      holdNoteStarted = closestHoldNote;
      this.activeHolds.add(holdNoteStarted);
    }

    return holdNoteStarted;
  }

  // Called when a touch/click is released
  checkHoldEnd() {
    // For now, assume any release hits the oldest active hold
    // A more robust solution would check coordinates
    if (this.activeHolds.size > 0) {
      const holdNoteToEnd = this.activeHolds.values().next().value;
      this.activeHolds.delete(holdNoteToEnd);
      this.notes = this.notes.filter(note => note !== holdNoteToEnd);
      // Here you would check if the hold was released at the right time
      // For simplicity, we'll just score it as a success for now.
      this.scoreManager.onHit();
    }
  }
}
