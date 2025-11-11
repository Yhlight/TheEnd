// src/core/ChartData.js

/**
 * A mock library of songs and their charts.
 * In a real application, this would likely be fetched from a server or read from files.
 */
export const songLibrary = [
  {
    id: 1,
    title: "Orion",
    artist: "A.I. Voice",
    chart: {
      notes: [
        { time: 1000, x: 0.2, type: 'hold', duration: 1000 }, // Hold note for 1 second
        { time: 1500, x: 0.8, type: 'tap' },
        { time: 2000, x: 0.5, type: 'flick' },
        { time: 2750, x: 0.3, type: 'tap' },
        { time: 3000, x: 0.7, type: 'hold', duration: 500 }, // Hold note for 0.5 seconds
      ],
      lineEvents: [
        { time: 2000, duration: 500, value: { rotation: 15, y: -100 }, easing: 'easeOutQuad' },
        { time: 3000, duration: 500, value: { rotation: -15, y: 100 }, easing: 'easeOutQuad' },
        { time: 4000, duration: 1000, value: { rotation: 0, y: 0 }, easing: 'easeInOutQuad' },
      ]
    }
  },
  {
    id: 2,
    title: "CyberPulse",
    artist: "SynthWave Dreamer",
    chart: {
      notes: [
        { time: 500, x: 0.5, type: 'tap' },
        { time: 1000, x: 0.25, type: 'flick' },
        { time: 1000, x: 0.75, type: 'flick' },
        { time: 1500, x: 0.5, type: 'tap' },
        { time: 2000, x: 0.1, type: 'tap' },
        { time: 2250, x: 0.9, type: 'tap' },
        {
          time: 3000,
          duration: 2000,
          type: 'drag',
          path: [
            [0, 0.1],      // Starts at the left
            [500, 0.3],    // Moves right
            [1000, 0.5],   // Moves to center
            [1500, 0.7],   // Continues right
            [2000, 0.9]    // Ends at the right
          ]
        },
      ],
      lineEvents: [
        { time: 1000, duration: 200, value: { x: -200 }, easing: 'easeInQuad' },
        { time: 1200, duration: 200, value: { x: 200 }, easing: 'linear' },
        { time: 1400, duration: 200, value: { x: 0 }, easing: 'easeOutQuad' },
      ]
    }
  },
  {
    id: 3,
    title: "Starlight Echoes",
    artist: "Celestial Harmonies",
    chart: {
      notes: [
        { time: 1000, x: 0.1, type: 'tap' },
        { time: 1250, x: 0.3, type: 'tap' },
        { time: 1500, x: 0.5, type: 'tap' },
        { time: 1750, x: 0.7, type: 'tap' },
        { time: 2000, x: 0.9, type: 'tap' },
        { time: 2500, x: 0.5, type: 'flick' },
      ],
      lineEvents: []
    }
  }
];
