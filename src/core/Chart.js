// src/core/Chart.js

/**
 * A simple hardcoded chart for testing purposes.
 * Each note has a 'time' (in milliseconds from the start) when it should be spawned,
 * and a normalized 'x' position (0 to 1) on the screen.
 */
export const testChart = {
  notes: [
    // Existing tap notes
    { time: 1000, x: 0.25, type: 'tap' },
    { time: 2000, x: 0.75, type: 'tap' },

    // Add a short hold note
    { time: 3000, x: 0.5, type: 'hold', duration: 500 }, // Starts at 3s, lasts for 0.5s

    // Add another tap note
    { time: 4000, x: 0.25, type: 'tap' },

    // Add a longer hold note
    { time: 5000, x: 0.75, type: 'hold', duration: 1000 }, // Starts at 5s, lasts for 1s

    { time: 6500, x: 0.5, type: 'tap' },
  ]
};
