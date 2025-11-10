// src/core/Chart.js

/**
 * A simple hardcoded chart for testing purposes.
 * Each note has a 'time' (in milliseconds from the start) when it should be spawned,
 * and a normalized 'x' position (0 to 1) on the screen.
 */
export const testChart = {
  notes: [
    { time: 1000, x: 0.25, type: 'tap' },
    { time: 1500, x: 0.75, type: 'tap' },
    { time: 2000, x: 0.5,  type: 'tap' },

    // A hold note starts at 2.75s and lasts for 1 second
    { time: 2750, x: 0.25, type: 'hold', duration: 1000 },

    { time: 4000, x: 0.75, type: 'tap' },

    // Another hold note starts at 4.5s and lasts for 0.5 seconds
    { time: 4500, x: 0.5, type: 'hold', duration: 500 },

    { time: 5250, x: 0.75, type: 'tap' },
    { time: 5500, x: 0.25, type: 'tap' },
  ],
  judgementLineEvents: [
    // Move the line from center to bottom at the beginning
    { time: 0,    duration: 1000, startY: 0.5, endY: 0.8, startRotation: 0, endRotation: 0 },
    // Rotate the line slightly at 2.5 seconds
    { time: 2500, duration: 500,  startY: 0.8, endY: 0.8, startRotation: 0, endRotation: 10 },
    // Rotate it back
    { time: 3500, duration: 500,  startY: 0.8, endY: 0.8, startRotation: 10, endRotation: 0 },
    // Move it up a bit
    { time: 5000, duration: 500,  startY: 0.8, endY: 0.6, startRotation: 0, endRotation: 0 },
  ]
};
