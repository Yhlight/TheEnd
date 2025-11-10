// src/core/JudgementLineManager.js

// Easing functions
const Easing = {
  linear: t => t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// A simple linear interpolation function
const lerp = (start, end, progress) => {
  return start + (end - start) * progress;
};

export class JudgementLineManager {
  constructor(judgementLine, chart, canvas) {
    this.judgementLine = judgementLine;
    this.canvas = canvas;
    this.lineEvents = chart.lineEvents ? [...chart.lineEvents].sort((a, b) => a.time - b.time) : [];

    // Store the initial state of the judgement line, normalized if necessary
    this.initialState = {
      x: this.judgementLine.x / this.canvas.width,
      y: this.judgementLine.y / this.canvas.height,
      rotation: this.judgementLine.rotation,
      alpha: this.judgementLine.alpha,
    };
  }

  update(gameTime) {
    // Get the current value for each animated property
    const x = this.getCurrentValue('x', gameTime);
    const y = this.getCurrentValue('y', gameTime);
    const rotation = this.getCurrentValue('rotation', gameTime);
    const alpha = this.getCurrentValue('alpha', gameTime);

    // Apply the new values (denormalizing where necessary)
    this.judgementLine.x = x * this.canvas.width;
    this.judgementLine.y = y * this.canvas.height;
    this.judgementLine.rotation = rotation;
    this.judgementLine.alpha = alpha;
  }

  /**
   * Calculates the animated value of a single property at a given time.
   * @param {string} property - The name of the property to animate (e.g., 'y', 'rotation').
   * @param {number} gameTime - The current time in milliseconds.
   * @returns {number} The calculated value for the property at the given time.
   */
  getCurrentValue(property, gameTime) {
    // Find all events that affect this property
    const relevantEvents = this.lineEvents.filter(e => e.value[property] !== undefined);

    // Find the last event that has already started
    let currentEvent = null;
    for (let i = relevantEvents.length - 1; i >= 0; i--) {
      if (relevantEvents[i].time <= gameTime) {
        currentEvent = relevantEvents[i];
        break;
      }
    }

    // If no event has started, return the initial value
    if (!currentEvent) {
      return this.initialState[property] ?? 0;
    }

    const animationEndTime = currentEvent.time + currentEvent.duration;

    // Check if we are currently inside the animation window for this event
    if (gameTime < animationEndTime) {
       // Find the value *before* this animation started
      const previousValue = this.findPreviousValue(property, currentEvent, relevantEvents);

      // Calculate progress (0 to 1)
      let progress = (gameTime - currentEvent.time) / currentEvent.duration;
      progress = Math.max(0, Math.min(1, progress)); // Clamp progress

      // Apply easing function
      const easingFunction = Easing[currentEvent.easing] || Easing.linear;
      const easedProgress = easingFunction(progress);

      // Interpolate from the previous value to the target value
      return lerp(previousValue, currentEvent.value[property], easedProgress);
    }

    // If the animation is finished, just return the final value
    return currentEvent.value[property];
  }

  /**
   * Finds the value of a property from the event chronologically before the given one.
   */
  findPreviousValue(property, currentEvent, relevantEvents) {
      let previousValue = this.initialState[property] ?? 0;
      // Find the event right before the current one in the filtered list
      const currentIndex = relevantEvents.indexOf(currentEvent);
      if (currentIndex > 0) {
        previousValue = relevantEvents[currentIndex - 1].value[property];
      }
      return previousValue;
  }
}
