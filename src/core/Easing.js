// src/core/Easing.js

/**
 * A collection of easing functions.
 * Each function takes a progress value 't' (from 0 to 1) and returns an eased value.
 * Based on the work of Robert Penner.
 */
export const Easing = {
  // No easing, no acceleration
  linear: t => t,

  // Accelerating from zero velocity
  easeInQuad: t => t * t,

  // Decelerating to zero velocity
  easeOutQuad: t => t * (2 - t),

  // Acceleration until halfway, then deceleration
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // More easing functions can be added here as needed...
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};
