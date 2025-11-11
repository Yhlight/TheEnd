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
        { time: 1000, x: 0.2, type: 'hold', duration: 1000 },
        { time: 1500, x: 0.8, type: 'tap' },
        { time: 2000, x: 0.5, type: 'flick' },
        { time: 2750, x: 0.3, type: 'tap' },
        { time: 3000, x: 0.7, type: 'hold', duration: 500 },
        { time: 4000, x: 0.2, type: 'tap' },
        { time: 4250, x: 0.8, type: 'tap' },
        { time: 4500, x: 0.5, type: 'flick' },
        { time: 5000, x: 0.5, type: 'tap' },
      ],
      // Events to move the judgement line
      // All values are relative to the default state
      lineEvents: [
        // At 2s, move y up by 150px and rotate 15deg over 0.5s
        { time: 2000, duration: 500, value: { y: -150, rotation: 15 }, easing: 'easeOutQuad' },
        // At 3s, move y down by 150px and rotate -15deg over 0.5s
        { time: 3000, duration: 500, value: { y: 150, rotation: -15 }, easing: 'easeOutQuad' },
        // At 4s, return to the default position (y=0, rotation=0) over 1s
        { time: 4000, duration: 1000, value: { y: 0, rotation: 0 }, easing: 'easeInOutQuad' },
      ]
    }
  }
];
