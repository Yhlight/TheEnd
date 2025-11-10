// src/core/JudgementLineManager.js

// A simple linear interpolation function
const lerp = (start, end, progress) => {
  return start + (end - start) * progress;
};

export class JudgementLineManager {
  constructor(judgementLine, events, canvas) {
    this.judgementLine = judgementLine;
    this.events = events;
    this.canvas = canvas; // Needed to denormalize Y coordinates
  }

  update(gameTime) {
    let activeEvent = null;

    // Find the current active event
    for (const event of this.events) {
      const eventEndTime = event.time + event.duration;
      if (gameTime >= event.time && gameTime <= eventEndTime) {
        activeEvent = event;
        break;
      }
    }

    if (activeEvent) {
      // Calculate the progress of the animation (0 to 1)
      const progress = (gameTime - activeEvent.time) / activeEvent.duration;

      // Interpolate Y position and rotation
      const newY = lerp(activeEvent.startY, activeEvent.endY, progress);
      const newRotation = lerp(activeEvent.startRotation, activeEvent.endRotation, progress);

      // Apply the new values (denormalizing Y)
      this.judgementLine.y = newY * this.canvas.height;
      this.judgementLine.rotation = newRotation;
    }
  }
}
