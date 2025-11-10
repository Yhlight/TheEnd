// src/core/Charts/TestChart1.js

export const testChart1 = {
  id: 'test1',
  title: 'Test Song 1',
  artist: 'Jules',
  notes: [
    { time: 1000, x: 0.25, type: 'tap' },
    { time: 1500, x: 0.75, type: 'tap' },
    { time: 2000, x: 0.5,  type: 'tap' },
    { time: 2750, x: 0.25, type: 'hold', duration: 1000 },
    { time: 4000, x: 0.75, type: 'tap' },
    { time: 4500, x: 0.5, type: 'hold', duration: 500 },
    { time: 5250, x: 0.75, type: 'tap' },
    { time: 5500, x: 0.25, type: 'tap' },
    { time: 6000, x: 0.5, type: 'flick' },
    { time: 6500, x: 0.3, type: 'flick' },
    { time: 6750, x: 0.7, type: 'flick' },
  ],
  lineEvents: [
    { time: 0,    duration: 500,  value: { alpha: 1 }, easing: 'easeOutCubic' },
    { time: 2500, duration: 500,  value: { rotation: 10 }, easing: 'easeInOutQuad' },
    { time: 3500, duration: 500,  value: { rotation: 0 }, easing: 'easeInOutQuad' },
    { time: 5000, duration: 1000, value: { y: 0.6 }, easing: 'easeOutCubic' },
    { time: 6000, duration: 1000, value: { y: 0.8 }, easing: 'easeOutCubic' },
  ]
};
