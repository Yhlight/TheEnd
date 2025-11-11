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
    this.activeDragNote = null;
    this.nextNoteIndex = 0;
  }

  loadChart(newChart) {
    this.chart = newChart;
    // Reset all state related to the previous chart
    this.notes = [];
    this.activeHolds.clear();
    this.activeDragNote = null;
    this.nextNoteIndex = 0;
    console.log("New chart loaded.");
  }

  update(gameTime) {
    // If there's no chart loaded, don't do anything
    if (!this.chart) return;

    const judgementLineY = this.judgementLine.y;
    while (
      this.nextNoteIndex < this.chart.notes.length &&
      gameTime >= (this.chart.notes[this.nextNoteIndex].time - this.scrollTime)
    ) {
      const noteData = this.chart.notes[this.nextNoteIndex];
      let newNote = null;
      switch (noteData.type) {
        case 'hold': newNote = new HoldNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
        case 'flick': newNote = new FlickNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
        case 'drag': newNote = new DragNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
        default: newNote = new TapNote(this.canvas, 0, judgementLineY, this.scrollTime, noteData); break;
      }
      if(newNote) this.notes.push(newNote);
      this.nextNoteIndex++;
    }

    for (const note of this.notes) {
      note.update(gameTime);
      const missThreshold = note.y > 100;
      if (!note.isMissed && missThreshold && note.type !== 'drag') {
        this.scoreManager.onMiss();
        note.markAsMissed();
      }
      const dragEndTime = note.time + note.duration;
      if (note.type === 'drag' && !note.isBeingHeld && gameTime > note.time + 100) {
        if (!note.isMissed) { this.scoreManager.onMiss(); note.markAsMissed(); }
      }
      if (note.type === 'drag' && note.isBeingHeld && gameTime >= dragEndTime) {
        this.scoreManager.onHit();
        this.activeDragNote = null;
        this.notes = this.notes.filter(n => n !== note);
      }
    }
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
      const dist = Math.abs(note.y);
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
      const dist = Math.abs(note.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestHold = note;
      }
    }
    if (closestHold && minDistance < hitWindow) {
      holdNoteStarted = closestHold;
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

  checkDragStart() {
    const hitWindow = 75;
    let dragNoteStarted = null;
    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'drag') continue;
      const distY = Math.abs(note.y);
      if (distY < hitWindow) {
        dragNoteStarted = note;
        break;
      }
    }
    if (dragNoteStarted) {
      dragNoteStarted.isBeingHeld = true;
      this.activeDragNote = dragNoteStarted;
      this.scoreManager.increaseCombo();
    }
    return dragNoteStarted;
  }

  checkDragUpdate(pointerX, pointerY) {
    if (!this.activeDragNote || this.activeDragNote.isMissed) return;
    const hitBoxWidth = this.activeDragNote.width * 1.5;
    const dist = Math.abs(pointerX - this.activeDragNote.x);
    if (dist > hitBoxWidth / 2) {
      this.scoreManager.onMiss();
      this.activeDragNote.markAsMissed();
      this.activeDragNote = null;
    } else {
      this.scoreManager.increaseCombo(0.1);
    }
  }

  checkDragEnd() {
    if (this.activeDragNote) {
      this.scoreManager.onMiss();
      this.activeDragNote.markAsMissed();
      this.activeDragNote = null;
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
