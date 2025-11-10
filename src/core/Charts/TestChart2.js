// src/core/Charts/TestChart2.js

export const testChart2 = {
  id: 'test2',
  title: 'Another Test Song',
  artist: 'Jules',
  notes: [
    { time: 500,  x: 0.5,  type: 'tap' },
    { time: 1000, x: 0.2,  type: 'tap' },
    { time: 1500, x: 0.8,  type: 'tap' },
    { time: 2000, x: 0.5,  type: 'hold', duration: 800 },
    { time: 3000, x: 0.3,  type: 'tap' },
    { time: 3250, x: 0.7,  type: 'tap' },
    { time: 4000, x: 0.5,  type: 'hold', duration: 1200 },
  ],
  judgementLineEvents: [
    { time: 0,    duration: 1500, startY: 0.2, endY: 0.7, startRotation: -15, endRotation: 15 },
    { time: 1500, duration: 1500, startY: 0.7, endY: 0.2, startRotation: 15,  endRotation: -15 },
    { time: 3000, duration: 2000, startY: 0.2, endY: 0.8, startRotation: -15, endRotation: 0 },
  ]
};
