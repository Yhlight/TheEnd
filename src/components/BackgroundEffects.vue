<template>
  <div class="background-effects">
    <div
      v-for="effect in activeEffects"
      :key="effect.id"
      :class="['effect', effect.type]"
      :style="effect.style"
    >
      <template v-if="effect.type === 'lineBurst'">
        <div
          v-for="i in effect.lineCount"
          :key="i"
          class="line"
          :style="{ transform: `rotate(${(360 / effect.lineCount) * i}deg)` }"
        ></div>
      </template>
    </div>
  </div>
</template>

<script>
let effectIdCounter = 0;

export default {
  name: 'BackgroundEffects',
  props: {
    songTime: { type: Number, required: true },
    fxEvents: { type: Array, default: () => [] },
  },
  data() {
    return {
      activeEffects: [],
      lastCheckedTime: 0,
    };
  },
  watch: {
    songTime(newTime, oldTime) {
      // Prevent re-triggering on seek-back or stutter
      if (newTime < oldTime) {
        this.lastCheckedTime = newTime;
        return;
      }

      // Check for events that should have been triggered since the last frame
      this.fxEvents.forEach(event => {
        if (event.time >= oldTime && event.time < newTime) {
          this.triggerEffect(event);
        }
      });

      this.lastCheckedTime = newTime;
    }
  },
  methods: {
    triggerEffect(event) {
      const id = effectIdCounter++;
      let style = {};

      if (event.type === 'lineBurst') {
        style = {
          left: `${event.x || 50}%`,
          top: `${event.y || 50}%`,
          '--duration': `${event.duration || 1000}ms`,
          '--color': event.color || '#ff00ff',
          '--line-width': `${event.lineWidth || 2}px`,
          '--line-count': event.lineCount || 12,
        };
      }

      const newEffect = {
        id,
        type: event.type,
        style,
        lineCount: event.lineCount || 12, // Pass lineCount for v-for
      };

      this.activeEffects.push(newEffect);

      setTimeout(() => {
        this.activeEffects = this.activeEffects.filter(e => e.id !== id);
      }, event.duration || 1000);
    },
  },
};
</script>

<style scoped>
.background-effects {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1; /* Below notes but above grid */
}

.effect {
  position: absolute;
}

.lineBurst {
  width: 1px;
  height: 1px;
}

.lineBurst .line {
  position: absolute;
  width: var(--line-width);
  height: 200vmax; /* Make sure lines are long enough to cross the screen */
  background-color: var(--color);
  box-shadow: 0 0 10px var(--color), 0 0 20px var(--color);
  top: -100vmax;
  left: calc(var(--line-width) / -2);
  transform-origin: bottom;
  animation: lineBurst-anim var(--duration) ease-out forwards;
}

@keyframes lineBurst-anim {
  0% {
    transform: scaleY(0);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: scaleY(1);
    opacity: 0;
  }
}
</style>
