// src/core/CameraManager.js
import { Easing, lerp } from '../utils/Easing.js';

export class CameraManager {
  constructor(events) {
    this.events = events ? events.sort((a, b) => a.time - b.time) : [];
    this.zoom = 1;
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
  }

  update(gameTime) {
    if (!this.events || this.events.length === 0) return;

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

    if (nextEvent) {
      const timeSinceLastEvent = gameTime - currentEvent.time;
      const eventDuration = nextEvent.time - currentEvent.time;
      let progress = eventDuration > 0 ? timeSinceLastEvent / eventDuration : 1;

      const easingFunction = Easing[nextEvent.easing] || Easing.linear;
      progress = easingFunction(progress);

      this.zoom = lerp(currentEvent.value.zoom, nextEvent.value.zoom, progress);
      this.rotation = lerp(currentEvent.value.rotation, nextEvent.value.rotation, progress);
      this.x = lerp(currentEvent.value.x, nextEvent.value.x, progress);
      this.y = lerp(currentEvent.value.y, nextEvent.value.y, progress);
    } else {
      this.zoom = currentEvent.value.zoom;
      this.rotation = currentEvent.value.rotation;
      this.x = currentEvent.value.x;
      this.y = currentEvent.value.y;
    }
  }
}
