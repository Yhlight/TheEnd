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
    audioUrl: '/hit.wav',
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
        { time: 5500, x: 0.15, type: 'catch', duration: 500 },
        { time: 6000, type: 'drag', duration: 2000, path: [ [0, 0.2], [1000, 0.8], [2000, 0.5] ] },
        { time: 8500, x: 0.85, type: 'catch', duration: 500 },
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
  },
  {
    id: 2,
    title: "Orion (Hard)",
    artist: "A.I. Voice",
    audioUrl: '/hit.wav',
    chart: {
      notes: [
        { time: 1000, x: 0.2, type: 'tap' },
        { time: 1250, x: 0.8, type: 'tap' },
        { time: 1500, x: 0.2, type: 'tap' },
        { time: 1750, x: 0.8, type: 'flick' },
        { time: 2000, x: 0.2, type: 'hold', duration: 500 },
        { time: 2500, x: 0.8, type: 'hold', duration: 500 },
        { time: 3000, x: 0.2, type: 'tap' },
        { time: 3125, x: 0.5, type: 'tap' },
        { time: 3250, x: 0.8, type: 'tap' },
        { time: 3500, x: 0.3, type: 'flick' },
        { time: 3750, x: 0.7, type: 'flick' },
        { time: 4000, x: 0.2, type: 'hold', duration: 1000 },
        { time: 4250, x: 0.8, type: 'tap' },
        { time: 4500, x: 0.2, type: 'tap' },
        { time: 4750, x: 0.8, type: 'flick' },
        { time: 5000, x: 0.5, type: 'tap' },
      ],
      lineEvents: [
        { time: 1000, duration: 500, value: { rotation: 10 }, easing: 'easeOutQuad' },
        { time: 1500, duration: 500, value: { rotation: -10 }, easing: 'easeInOutQuad' },
        { time: 2000, duration: 1000, value: { y: 100, rotation: 0 }, easing: 'easeInQuad' },
        { time: 3000, duration: 1000, value: { y: 0 }, easing: 'easeOutElastic' },
        { time: 4000, duration: 1000, value: { rotation: 360 }, easing: 'linear' },
        { time: 5000, duration: 500, value: { rotation: 0 }, easing: 'easeOutQuad' },
      ]
    }
  },
  {
    id: 3,
    title: "Catastrophe",
    artist: "A.I. Voice",
    audioUrl: '/hit.wav',
    chart: {
      notes: [
        // Opening sequence
        { time: 1000, x: 0.5, type: 'tap' },
        { time: 1500, x: 0.2, type: 'tap' },
        { time: 1750, x: 0.8, type: 'tap' },
        { time: 2000, x: 0.2, type: 'tap' },
        { time: 2250, x: 0.8, type: 'tap' },
        // Fast part with line rotation
        { time: 3000, x: 0.3, type: 'flick' },
        { time: 3250, x: 0.7, type: 'flick' },
        { time: 3500, x: 0.1, type: 'tap' },
        { time: 3750, x: 0.9, type: 'tap' },
        // Hold note during line movement
        { time: 4000, x: 0.5, type: 'hold', duration: 1500 },
        { time: 4250, x: 0.1, type: 'tap' },
        { time: 4750, x: 0.9, type: 'tap' },
        // Drag note across the screen
        { time: 6000, type: 'drag', duration: 2000, path: [ [0, 0.1], [500, 0.9], [1000, 0.2], [1500, 0.8], [2000, 0.5] ] },
        // Catch notes while line is transparent
        { time: 8500, x: 0.2, type: 'catch', duration: 500 },
        { time: 9500, x: 0.8, type: 'catch', duration: 500 },
        // Final flick notes
        { time: 10500, x: 0.5, type: 'flick' },
        { time: 10750, x: 0.5, type: 'flick' },
      ],
      lineEvents: [
        // Fast rotation at the beginning
        { time: 2500, duration: 1000, value: { rotation: 90 }, easing: 'easeInOutQuad' },
        { time: 3500, duration: 500, value: { rotation: 0 }, easing: 'easeOutQuad' },
        // Move line to the top while holding a note
        { time: 4000, duration: 1000, value: { y: -200 }, easing: 'easeInOutSine' },
        { time: 5000, duration: 1000, value: { y: 0 }, easing: 'easeOutBounce' },
        // Full 360 spin with a drag note
        { time: 6000, duration: 2000, value: { rotation: 360 }, easing: 'linear' },
        { time: 8000, duration: 500, value: { rotation: 0 }, easing: 'easeOutQuad' },
        // Fade out and back in
        { time: 8250, duration: 500, value: { alpha: 0.1 }, easing: 'easeInQuad' },
        { time: 9250, duration: 500, value: { alpha: 1.0 }, easing: 'easeOutQuad' },
        // Final dramatic zoom and shake (using y and small rotation)
        { time: 10000, duration: 250, value: { y: -50, rotation: 5 }, easing: 'easeOutQuad' },
        { time: 10250, duration: 500, value: { y: 0, rotation: 0 }, easing: 'easeOutElastic' },
      ]
    }
  }
];
