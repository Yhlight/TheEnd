// src/core/NoteManager.js
import { TapNote } from './TapNote.js';
import { HoldNote } from './HoldNote.js';
import { FlickNote } from './FlickNote.js';
import { DragNote } from './DragNote.js';

const BASE_SCROLL_TIME = 3000;

export class NoteManager {
  constructor(canvas, chart, scoreManager, judgementLine, audioManager, noteSpeed = 1) {
    this.canvas = canvas;
    this.chart = chart;
    this.scoreManager = scoreManager;
    this.judgementLine = judgementLine;
    this.audioManager = audioManager;
    this.noteSpeed = noteSpeed;
    this.scrollTime = BASE_SCROLL_TIME / this.noteSpeed;

    this.notes = [];
    this.activeHolds = new Set();
    this.activeDragNote = null; // To track the currently held drag note
    this.nextNoteIndex = 0;
  }

  setNoteSpeed(newSpeed) {
    this.noteSpeed = newSpeed;
    this.scrollTime = BASE_SCROLL_TIME / this.noteSpeed;
  }

  loadChart(newChart) {
    this.chart = newChart;
    this.notes = [];
    this.activeHolds.clear();
    this.activeDragNote = null; // Reset active drag note
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
      if (!note.isMissed && !note.isBeingHeld && note.y > missThreshold) {
        if (note.type === 'hold' || note.type === 'drag') {
            this.scoreManager.onMiss();
            note.markAsMissed();
            this.audioManager.playMissSound();
        } else {
            this.scoreManager.onMiss();
            note.markAsMissed();
            this.audioManager.playMissSound();
        }
      }
    }

    // Update active holds
    this.activeHolds.forEach(holdNote => {
      const endTime = holdNote.time + holdNote.duration;
      if (gameTime >= endTime) {
        this.scoreManager.onHit();
        holdNote.isAlive = () => false;
        this.activeHolds.delete(holdNote);
      } else {
        this.scoreManager.increaseCombo(0.1);
      }
    });

    // Update active drag note for successful completion
    if (this.activeDragNote) {
      const endTime = this.activeDragNote.time + this.activeDragNote.duration;
      if (gameTime >= endTime) {
        this.scoreManager.onHit(); // Final hit for completing the drag
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
       this.activeHolds.forEach(holdNote => {
         this.scoreManager.onMiss();
         holdNote.markAsMissed();
       });
       this.activeHolds.clear();
    }
  }

  checkDragStart() {
    if (this.activeDragNote) return null; // Can't start a new drag if one is active

    const hitWindow = 75;
    let dragNoteStarted = null;
    let closestDrag = null;
    let minDistance = Infinity;

    for (const note of this.notes) {
      if (note.isMissed || note.type !== 'drag') continue;
      // For drag notes, we only care about the y-distance for starting
      const distY = Math.abs(note.y - this.judgementLine.y);
      if (distY < minDistance) {
          minDistance = distY;
          closestDrag = note;
      }
    }

    if (closestDrag && minDistance < hitWindow) {
      dragNoteStarted = closestDrag;
      dragNoteStarted.isBeingHeld = true;
      this.activeDragNote = dragNoteStarted;
      this.scoreManager.onHit(); // Score for starting the drag
    }
    return dragNoteStarted;
  }

  checkDragUpdate(pointerX) {
    if (!this.activeDragNote) return;

    const hitBoxWidth = this.activeDragNote.width * 2; // A generous hitbox
    const noteCenterX = this.activeDragNote.x;

    if (Math.abs(pointerX - noteCenterX) > hitBoxWidth / 2) {
      this.scoreManager.onMiss();
      this.activeDragNote.markAsMissed();
      this.activeDragNote = null;
    } else {
      // Give continuous score/combo for dragging
      this.scoreManager.increaseCombo(0.2);
    }
  }

  checkDragEnd() {
    if (this.activeDragNote) {
      // Player released finger before the note ended
      this.scoreManager.onMiss();
      this.activeDragNote.markAsMissed();
      this.activeDragNote = null;
    }
  }
}
