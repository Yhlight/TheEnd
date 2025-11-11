// src/core/ChartData.js

/**
 * A mock library of songs and their charts.
 */
export const songLibrary = [
  {
    id: 1,
    title: "Orion",
    artist: "A.I. Voice",
    chart: {
      notes: [
        { time: 1000, x: 0.2, type: 'hold', duration: 1000 },
        { time: 1500, x: 0.8, type: 'tap' },
        { time: 2000, x: 0.5, type: 'flick' },
        { time: 2750, x: 0.3, type: 'tap' },
        { time: 3000, x: 0.7, type: 'hold', duration: 500 },
        { time: 4000, x: 0.2, type: 'tap' },
        { time: 4250, x: 0.8, type: 'tap' },
        { time: 4500, x: 0.5, type: 'flick' },
        { time: 5000, x: 0.5, type: 'tap' },
        {
          time: 8000,
          type: 'drag',
          duration: 2000,
          path: [
            [0, 0.1],
            [500, 0.3],
            [1000, 0.7],
            [1500, 0.9],
            [2000, 0.5]
          ]
        },
      ],
      lineEvents: [
        { time: 2000, duration: 500, value: { y: -150, rotation: 15 }, easing: 'easeOutQuad' },
        { time: 3000, duration: 500, value: { y: 150, rotation: -15 }, easing: 'easeOutQuad' },
        { time: 4000, duration: 1000, value: { y: 0, rotation: 0 }, easing: 'easeInOutQuad' },

        // New events for x and alpha
        { time: 6000, duration: 500, value: { x: -200, alpha: 0.5 }, easing: 'easeInOutSine' },
        { time: 7000, duration: 500, value: { x: 200 }, easing: 'easeInOutSine' },
        { time: 8000, duration: 1000, value: { x: 0, alpha: 1.0 }, easing: 'easeOutBounce' }
      ]
    }
  },
  {
    id: 2,
    title: "Starlight",
    artist: "Synth Weaver",
    chart: { /* Placeholder chart */ notes: [], lineEvents: [] }
  },
  {
    id: 3,
    title: "Echoes",
    artist: "Ghost Note",
    chart: { /* Placeholder chart */ notes: [], lineEvents: [] }
  },
    {
    id: 4,
    title: "Mirage",
    artist: "Pixel Pulse",
    chart: { /* Placeholder chart */ notes: [], lineEvents: [] }
  }
];
