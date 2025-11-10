// src/core/NoteManager.js
import { Note } from './Note.js';

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, scrollTime = 1500) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.scrollTime = scrollTime;
    this.notes = [];
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
      const newNote = new Note(this.canvas, noteData.x * this.canvas.width, judgementLineY, this.scrollTime);
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

  checkHit() {
    const hitWindow = 75;
    const judgementLineY = this.judgementLine.y;

    if (this.notes.length === 0) {
      return null;
    }

    // Find the closest non-missed note to the judgement line
    let closestNote = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed) continue; // Ignore already missed notes

      const dist = Math.abs(note.y - judgementLineY);
      if (dist < minDistance) {
        minDistance = dist;
        closestNote = note;
      }
    }

    if (closestNote && minDistance < hitWindow) {
      // Remove the hit note by filtering
      this.notes = this.notes.filter(note => note !== closestNote);
      return closestNote;
    }

    return null;
  }
}
