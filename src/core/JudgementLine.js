// src/core/JudgementLine.js
import { Easing, lerp } from '../utils/Easing.js';

/**
 * Manages the state and animation of the judgement line.
 * It processes a list of events from the chart to determine its
 * position, rotation, and alpha at any given game time.
 */
export class JudgementLine {
  constructor(events) {
    this.events = events.sort((a, b) => a.time - b.time);
    this.x = 0; // The canvas will be translated to this x
    this.y = 0; // The canvas will be translated to this y
    this.rotation = 0; // The canvas will be rotated by this amount
    this.alpha = 1;
    this.flashOpacity = 0; // For hit feedback
  }

  /**
   * Updates the judgement line's properties based on the current game time.
   * @param {number} gameTime - The current time in milliseconds.
   */
  update(gameTime) {
    if (!this.events || this.events.length === 0) return;

    // Find the current and next events
    let currentEvent = this.events[0];
    for (let i = this.events.length - 1; i >= 0; i--) {
      if (gameTime >= this.events[i].time) {
        currentEvent = this.events[i];
        break;
      }
    }

    let nextEvent = null;
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].time > gameTime) {
        nextEvent = this.events[i];
        break;
      }
    }

    // Set properties based on interpolation or static event values
    if (nextEvent) {
      const timeSinceLastEvent = gameTime - currentEvent.time;
      const eventDuration = nextEvent.time - currentEvent.time;
      let progress = eventDuration > 0 ? timeSinceLastEvent / eventDuration : 1;

      const easingFunction = Easing[nextEvent.easing] || Easing.linear;
      progress = easingFunction(progress);

      this.x = lerp(currentEvent.value.x, nextEvent.value.x, progress);
      this.y = lerp(currentEvent.value.y, nextEvent.value.y, progress);
      this.rotation = lerp(currentEvent.value.rotation, nextEvent.value.rotation, progress);
      this.alpha = lerp(currentEvent.value.alpha, nextEvent.value.alpha, progress);
    } else {
      this.x = currentEvent.value.x;
      this.y = currentEvent.value.y;
      this.rotation = currentEvent.value.rotation;
      this.alpha = currentEvent.value.alpha;
    }

    // Update flash effect
    if (this.flashOpacity > 0) {
      this.flashOpacity -= 0.05; // Fade out speed
    }
  }

  /**
   * Triggers a flash animation on the line.
   */
  flash() {
    this.flashOpacity = 1.0;
  }

  /**
   * Draws the judgement line on the canvas.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {number} width - The width of the canvas.
   * @param {number} height - The height of the canvas.
   */
  draw(ctx, width, height) {
    // The canvas is already transformed. We just need to draw the line.

    // Main line
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-width, 0); // Draw across the entire potential screen width
    ctx.lineTo(width, 0);
    ctx.stroke();

    // Flash effect
    if (this.flashOpacity > 0) {
      ctx.globalAlpha = this.flashOpacity;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 10;
      ctx.filter = 'blur(10px)';
      ctx.beginPath();
      ctx.moveTo(-width, 0);
      ctx.lineTo(width, 0);
      ctx.stroke();
      ctx.filter = 'none'; // Reset filter
    }

    ctx.globalAlpha = 1.0; // Reset global alpha
  }
}
