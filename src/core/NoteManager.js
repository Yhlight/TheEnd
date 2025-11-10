// src/core/NoteManager.js
import { Note } from './Note.js';

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, scrollTime = 1500) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine; // Store the entire object
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

    // Update all active notes
    for (const note of this.notes) {
      note.update();
    }

    // Filter out missed notes
    const missThreshold = 100;
    const remainingNotes = [];
    for (const note of this.notes) {
      if (note.y > judgementLineY + missThreshold) {
        this.scoreManager.onMiss();
      } else {
        remainingNotes.push(note);
      }
    }
    this.notes = remainingNotes;
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

    let closestNote = this.notes[0];
    let minDistance = Math.abs(closestNote.y - judgementLineY);

    for (let i = 1; i < this.notes.length; i++) {
      const dist = Math.abs(this.notes[i].y - judgementLineY);
      if (dist < minDistance) {
        minDistance = dist;
        closestNote = this.notes[i];
      }
    }

    if (minDistance < hitWindow) {
      this.notes = this.notes.filter(note => note !== closestNote);
      return closestNote;
    }

    return null;
  }
}
