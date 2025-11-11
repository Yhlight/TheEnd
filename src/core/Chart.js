// src/core/Chart.js

/**
 * A simple hardcoded chart for testing purposes.
 * Each note has a 'time' (in milliseconds from the start) when it should be spawned,
 * and a normalized 'x' position (0 to 1) on the screen.
 */
export const testChart = {
  notes: [
    // A tap note to start
    { time: 1000, x: 0.25, type: 'tap' },

    // Introduce a flick note
    { time: 2000, x: 0.75, type: 'flick' },

    // A hold note
    { time: 3000, x: 0.5, type: 'hold', duration: 500 },

    // A couple more flicks and taps
    { time: 4000, x: 0.25, type: 'flick' },
    { time: 4500, x: 0.75, type: 'tap' },

    // A longer hold note
    { time: 5500, x: 0.75, type: 'hold', duration: 1000 },

    // End with a flick
    { time: 7000, x: 0.5, type: 'flick' },

    // Example Drag Note
    {
      time: 8000,
      type: 'drag',
      duration: 2000,
      path: [
        [0, 0.1],      // Start at 8000ms, at 10% of screen width
        [500, 0.3],    // At 8500ms, move to 30%
        [1000, 0.7],   // At 9000ms, move to 70%
        [1500, 0.9],   // At 9500ms, move to 90%
        [2000, 0.5]    // End at 10000ms, back at 50%
      ]
    },
  ]
};
