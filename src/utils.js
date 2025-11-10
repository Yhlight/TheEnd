/**
 * Easing functions for animations.
 */
export const easingFunctions = {
  linear: t => t,
  'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

/**
 * Calculates the perpendicular distance from a point to a line segment.
 * @param {object} point - The point ({ x, y }).
 * @param {object} lineStart - The start of the line segment ({ x, y }).
 * @param {object} lineEnd - The end of the line segment ({ x, y }).
 * @returns {number} The distance.
 */
export function distanceToLineSegment(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const l2 = dx * dx + dy * dy;

  if (l2 === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };

  return Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y);
}
