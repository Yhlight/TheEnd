// src/core/Chart.js

/**
 * A simple hardcoded chart for testing purposes.
 * Each note has a 'time' (in milliseconds from the start) when it should be spawned,
 * and a normalized 'x' position (0 to 1) on the screen.
 */
export const testChart = {
  notes: [
    { time: 1000, x: 0.25 }, // Appears at 1s, at 25% of screen width
    { time: 1500, x: 0.75 }, // Appears at 1.5s, at 75% of screen width
    { time: 2000, x: 0.5 },  // Appears at 2s, at 50% of screen width
    { time: 2750, x: 0.25 },
    { time: 3000, x: 0.75 },
    { time: 3250, x: 0.5 },
    { time: 3500, x: 0.75 },
    { time: 3750, x: 0.25 },
  ]
};
