// src/core/NoteManager.js
import { TapNote } from './notes/TapNote.js';
import { HoldNote } from './notes/HoldNote.js';
import { SwipeNote } from './notes/SwipeNote.js';
import { CatchNote } from './notes/CatchNote.js';

const TIMING_WINDOWS = {
  perfect: 50, // +/- 50ms
  good: 100,   // +/- 100ms
  miss: 200,    // after 200ms
};

export class NoteManager {
  constructor(chart, noteSpeed, noteSize = 100) {
    this.chart = chart;
    this.noteSpeed = noteSpeed;
    this.noteSize = noteSize; // Percentage
    this.notes = [];
    this.activeHolds = new Set();

    this.loadChart(chart);
  }

  loadChart(chart) {
    this.notes = chart.notes.map(noteData => {
      switch (noteData.type) {
        case 'tap':
          return new TapNote(noteData);
        case 'hold':
          return new HoldNote(noteData);
        case 'swipe':
          return new SwipeNote(noteData);
        case 'catch':
            return new CatchNote(noteData);
        default:
          console.warn(`Unknown note type: ${noteData.type}`);
          return null;
      }
    }).filter(note => note !== null); // Filter out any unknown types
  }

  /**
   * Updates all notes and handles automatic misses.
   * @param {number} gameTime - The current time in milliseconds.
   * @param {boolean} isDragging - Whether the user is currently holding down the pointer.
   * @returns {Array<object>} An array of judgements for notes that were processed.
   */
  update(gameTime, isDragging) {
    const processedJudgements = [];
    const noteSizeMultiplier = this.noteSize / 100.0;
    this.notes.forEach(note => {
      // Update note's visual state
      note.update(gameTime, this.noteSpeed, noteSizeMultiplier);

      // Check for misses
      if (!note.isJudged && gameTime > note.time + TIMING_WINDOWS.miss) {
        note.miss();
        processedJudgements.push({ judgement: 'miss', note });
      }

      // Handle catch notes
      if (note.type === 'catch' && !note.isJudged && isDragging) {
          const timeDiff = Math.abs(gameTime - note.time);
          if (timeDiff <= TIMING_WINDOWS.good) {
              let judgement = timeDiff <= TIMING_WINDOWS.perfect ? 'perfect' : 'good';
              note.judge(judgement, gameTime);
              processedJudgements.push({ judgement, note });
          }
      }

      // Check for early release of hold notes
      if (note.type === 'hold' && note.isBeingHeld && gameTime > note.endTime) {
         // This case is handled in checkHoldRelease, but as a fallback:
         note.isBeingHeld = false;
      }
    });

    // Remove notes that are no longer alive
    this.notes = this.notes.filter(note => note.isAlive(gameTime, TIMING_WINDOWS.miss));

    return missedJudgements;
  }

  /**
   * Checks for a tap or hold note hit at the current time.
   * @param {number} gameTime - The current time in milliseconds.
   * @returns {object|null} The judgement and the note that was hit, or null.
   */
  checkTapHit(gameTime) {
    // Find the closest, unjudged tap or hold note within the 'good' window
    let bestCandidate = null;
    let smallestTimeDiff = Infinity;

    for (const note of this.notes) {
      if (note.isJudged) continue;
      // This method now ONLY handles tap and hold
      if (note.type !== 'tap' && note.type !== 'hold') continue;

      const timeDiff = Math.abs(gameTime - note.time);
      if (timeDiff < TIMING_WINDOWS.good && timeDiff < smallestTimeDiff) {
        smallestTimeDiff = timeDiff;
        bestCandidate = note;
      }
    }

    if (bestCandidate) {
      let judgement = 'good';
      if (smallestTimeDiff <= TIMING_WINDOWS.perfect) {
        judgement = 'perfect';
      }

      bestCandidate.judge(judgement, gameTime);

      if (bestCandidate.type === 'hold') {
        bestCandidate.isBeingHeld = true;
        this.activeHolds.add(bestCandidate);
      }

      return { judgement, note: bestCandidate };
    }

    return null;
  }

  /**
   * Checks for a swipe note hit, requiring a certain velocity.
   * @param {number} gameTime - The current time in milliseconds.
   * @param {{x: number, y: number}} velocity - The pointer's velocity vector.
   * @returns {object|null} The judgement and the note that was hit, or null.
   */
  checkSwipeHit(gameTime, velocity) {
    const SWIPE_VELOCITY_THRESHOLD = 1.5; // pixels per millisecond
    const totalVelocity = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    if (totalVelocity < SWIPE_VELOCITY_THRESHOLD) {
      return null;
    }

    // Find the closest, unjudged swipe note within the 'good' window
    let bestCandidate = null;
    let smallestTimeDiff = Infinity;

    for (const note of this.notes) {
      if (note.isJudged || note.type !== 'swipe') continue;

      const timeDiff = Math.abs(gameTime - note.time);
      if (timeDiff < TIMING_WINDOWS.good && timeDiff < smallestTimeDiff) {
        smallestTimeDiff = timeDiff;
        bestCandidate = note;
      }
    }

    if (bestCandidate) {
      // Swipe judgements are stricter
      let judgement = 'good';
      if (smallestTimeDiff <= TIMING_WINDOWS.perfect) {
        judgement = 'perfect';
      }

      bestCandidate.judge(judgement, gameTime);
      return { judgement, note: bestCandidate };
    }

    return null;
  }

  /**
   * Checks if any active hold notes have been released.
   * @param {number} gameTime - The current time in milliseconds.
   * @returns {Array<object>} An array of judgements for released holds.
   */
  checkHoldRelease(gameTime) {
    const releasedJudgements = [];

    this.activeHolds.forEach(holdNote => {
      const timeHeld = gameTime - holdNote.time;

      // Check if hold is complete
      if (gameTime >= holdNote.endTime) {
        holdNote.isBeingHeld = false;
        holdNote.judge('perfect', holdNote.endTime); // Judge it at its intended end time
        releasedJudgements.push({ judgement: 'perfect', note: holdNote });
        this.activeHolds.delete(holdNote);
      }
      // Check for early release
      else {
        holdNote.isBeingHeld = false;
        // Penalize for early release, could be a 'good' or even 'miss'
        if (timeHeld / holdNote.duration >= 0.5) { // Held for at least half
            holdNote.judge('good', gameTime);
            releasedJudgements.push({ judgement: 'good', note: holdNote });
        } else {
            holdNote.miss();
            releasedJudgements.push({ judgement: 'miss', note: holdNote });
        }
        this.activeHolds.delete(holdNote);
      }
    });

    return releasedJudgements;
  }

  /**
   * Draws all active notes.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} canvasWidth - The width of the game area.
   */
  draw(ctx, canvasWidth) {
    this.notes.forEach(note => {
      // Convert normalized x-coordinate to canvas coordinates
      // The canvas is already translated to the judgement line's center
      note.renderX = (note.x - 0.5) * canvasWidth;
      note.draw(ctx);
    });
  }
}
