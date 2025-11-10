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

    // A drag note that starts at 5.5s, lasts for 2 seconds
    {
      time: 5500,
      type: 'drag',
      path: [
        [0, 0.2],    // Starts at x=0.2 at 5500ms
        [1000, 0.8], // Moves to x=0.8 at 6500ms
        [2000, 0.5]  // Ends at x=0.5 at 7500ms
      ]
    },
  ],
  lineEvents: [
    { time: 0,    duration: 1500, value: { y: 0.7, rotation: 15 }, easing: 'easeInOutQuad' },
    { time: 1500, duration: 1500, value: { y: 0.2, rotation: -15 }, easing: 'easeInOutQuad' },
    { time: 3000, duration: 2000, value: { y: 0.8, rotation: 0 }, easing: 'easeOutCubic' },
  ]
};
