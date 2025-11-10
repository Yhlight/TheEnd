// src/core/NoteManager.js
import { Note } from './Note.js';

export class NoteManager {
  constructor(canvas, chart) {
    this.canvas = canvas;
    this.chart = chart;
    this.notes = []; // Array to hold active notes
    this.nextNoteIndex = 0;
  }

  update(gameTime) {
    // Spawn new notes
    while (
      this.nextNoteIndex < this.chart.notes.length &&
      gameTime >= this.chart.notes[this.nextNoteIndex].time
    ) {
      const noteData = this.chart.notes[this.nextNoteIndex];
      const newNote = new Note(this.canvas, noteData.x * this.canvas.width);
      this.notes.push(newNote);
      this.nextNoteIndex++;
    }

    // Update all active notes
    for (const note of this.notes) {
      note.update();
    }

    // Remove off-screen notes
    this.notes = this.notes.filter(note => note.y < this.canvas.height + 50);
  }

  draw() {
    for (const note of this.notes) {
      note.draw();
    }
  }

  checkHit(judgementLineY) {
    const hitWindow = 75;

    if (this.notes.length === 0) {
      return null;
    }

    // Find the note closest to the judgement line
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
