// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';
import { FlickNote } from './FlickNote.js';
import { DragNote } from './DragNote.js';

const BASE_SCROLL_TIME = 3000;

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

  loadChart(newChart) {
    this.chart = newChart;
    this.notes = [];
    this.activeHolds.clear();
    this.nextNoteIndex = 0;
    console.log("New chart loaded.");
  }

  update(gameTime) {
    if (!this.chart) return;

    // Spawn new notes
    while (
      this.nextNoteIndex < this.chart.notes.length &&
      gameTime >= (this.chart.notes[this.nextNoteIndex].time - this.scrollTime)
    ) {
      const noteData = this.chart.notes[this.nextNoteIndex];
      let newNote = null;
      const judgementLineY = this.judgementLine.y;
      switch (noteData.type) {
        case 'hold': newNote = new HoldNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
        case 'flick': newNote = new FlickNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
        case 'drag': newNote = new DragNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
        default: newNote = new TapNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
      }
      if(newNote) this.notes.push(newNote);
      this.nextNoteIndex++;
    }

    // Update all notes and handle misses
    for (const note of this.notes) {
      note.update(gameTime);
      const missThreshold = this.judgementLine.y + 100;
      // Miss condition for non-held notes
      if (!note.isMissed && !note.isBeingHeld && note.y > missThreshold) {
         if (note.type === 'hold') { // Special case for missing the start of a hold
            this.scoreManager.onMiss();
            note.markAsMissed();
        } else if (note.type !== 'drag') {
            this.scoreManager.onMiss();
            note.markAsMissed();
        }
      }
    }

    // Update active holds
    this.activeHolds.forEach(holdNote => {
      const endTime = holdNote.time + holdNote.duration;
      if (gameTime >= endTime) {
        // Hold completed successfully
        this.scoreManager.onHit(); // Final hit for completing the hold
        holdNote.isAlive = () => false; // Mark for removal
        this.activeHolds.delete(holdNote);
      } else {
        // Give continuous score/combo for holding
        this.scoreManager.increaseCombo(0.1);
      }
    });

    this.notes = this.notes.filter(note => note.isAlive());
  }

  draw(ctx, judgementLineX) {
    for (const note of this.notes) {
      note.draw(ctx, judgementLineX);
    }
  }

  checkTapHit() {
    const hitWindow = 75;
    let hitNote = null;
    let closestHittable = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || (note.type !== 'tap' && note.type !== 'flick')) continue;
      const dist = Math.abs(note.y - this.judgementLine.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestHittable = note;
      }
    }

    if (closestHittable && minDistance < hitWindow) {
      hitNote = closestHittable;
      this.notes = this.notes.filter(note => note !== hitNote);
    }
    return hitNote;
  }

  checkHoldStart() {
    const hitWindow = 75;
    let holdNoteStarted = null;
    let closestHold = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'hold') continue;
      const dist = Math.abs(note.y - this.judgementLine.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestHold = note;
      }
    }

    if (closestHold && minDistance < hitWindow) {
      holdNoteStarted = closestHold;
      holdNoteStarted.isBeingHeld = true;
      this.activeHolds.add(holdNoteStarted);
      this.scoreManager.onHit(); // Score for starting the hold
    }
    return holdNoteStarted;
  }

  checkHoldEnd() {
    if (this.activeHolds.size > 0) {
       // When a pointer is released, we check all active holds.
       // This simple model assumes one finger, so all holds are "released".
       this.activeHolds.forEach(holdNote => {
         this.scoreManager.onMiss();
         holdNote.markAsMissed();
       });
       this.activeHolds.clear();
    }
  }
}
