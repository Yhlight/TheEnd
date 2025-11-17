import { Graphics } from 'pixi.js';

/**
 * Creates a square graphic.
 *
 * @param {number} x - The x-coordinate of the square's center.
 * @param {number} y - The y-coordinate of the square's center.
 * @param {number} size - The side length of the square.
 * @param {number} color - The color of the square (e.g., 0xFFFFFF for white).
 * @returns {Graphics} The PixiJS Graphics object representing the square.
 */
export function drawSquare(x, y, size, color) {
  const square = new Graphics();
  square.rect(0, 0, size, size);
  square.fill(color);
  // We offset the position by half the size to make (x, y) the center point.
  square.x = x - size / 2;
  square.y = y - size / 2;
  return square;
}
