// src/core/JudgementLineManager.js

const Easing = {
  linear: t => t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

const lerp = (start, end, progress) => {
  return start + (end - start) * progress;
};

export class JudgementLineManager {
  constructor(judgementLine, chart, canvas) {
    this.judgementLine = judgementLine;
    this.canvas = canvas;
    this.lineEvents = chart.lineEvents ? [...chart.lineEvents].sort((a, b) => a.time - b.time) : [];
    this.initialState = {
      x: this.judgementLine.x / this.canvas.width,
      y: this.judgementLine.y / this.canvas.height,
      rotation: this.judgementLine.rotation,
      alpha: this.judgementLine.alpha,
    };
  }

  update(gameTime) {
    const x = this.getCurrentValue('x', gameTime);
    const y = this.getCurrentValue('y', gameTime);
    const rotation = this.getCurrentValue('rotation', gameTime);
    const alpha = this.getCurrentValue('alpha', gameTime);
    this.judgementLine.x = x * this.canvas.width;
    this.judgementLine.y = y * this.canvas.height;
    this.judgementLine.rotation = rotation;
    this.judgementLine.alpha = alpha;
  }

  getCurrentValue(property, gameTime) {
    const relevantEvents = this.lineEvents.filter(e => e.value[property] !== undefined);
    let currentEvent = null;
    for (let i = relevantEvents.length - 1; i >= 0; i--) {
      if (relevantEvents[i].time <= gameTime) {
        currentEvent = relevantEvents[i];
        break;
      }
    }

    if (!currentEvent) {
      return this.initialState[property] ?? 0;
    }

    const animationEndTime = currentEvent.time + currentEvent.duration;

    if (gameTime < animationEndTime) {
      const previousValue = this.findPreviousValue(property, currentEvent, relevantEvents);
      let progress = (gameTime - currentEvent.time) / currentEvent.duration;
      progress = Math.max(0, Math.min(1, progress));
      const easingFunction = Easing[currentEvent.easing] || Easing.linear;
      const easedProgress = easingFunction(progress);
      return lerp(previousValue, currentEvent.value[property], easedProgress);
    }

    return currentEvent.value[property];
  }

  findPreviousValue(property, currentEvent, relevantEvents) {
      let previousValue = this.initialState[property] ?? 0;
      const currentIndex = relevantEvents.indexOf(currentEvent);
      if (currentIndex > 0) {
        previousValue = relevantEvents[currentIndex - 1].value[property];
      }
      return previousValue;
  }
}
