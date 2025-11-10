// src/core/Chart.js

/**
 * A simple hardcoded chart for testing purposes.
 * Each note has a 'time' (in milliseconds from the start) when it should be spawned,
 * and a normalized 'x' position (0 to 1) on the screen.
 */
export const testChart1 = {
  id: 'test1',
  title: 'Test Song 1',
  artist: 'Jules',
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
  lineEvents: [
    // Fade in
    { time: 0,    duration: 500,  value: { alpha: 1 }, easing: 'easeOutCubic' },
    // Rotate the line slightly at 2.5 seconds
    { time: 2500, duration: 500,  value: { rotation: 10 }, easing: 'easeInOutQuad' },
    // Rotate it back
    { time: 3500, duration: 500,  value: { rotation: 0 }, easing: 'easeInOutQuad' },
    // Move it up a bit
    { time: 5000, duration: 1000, value: { y: 0.6 }, easing: 'easeOutCubic' },
     // Move it down a bit
    { time: 6000, duration: 1000, value: { y: 0.8 }, easing: 'easeOutCubic' },
  ]
};
