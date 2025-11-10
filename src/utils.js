/**
 * Easing functions for animations.
 */
export const easingFunctions = {
  linear: t => t,
  'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};
