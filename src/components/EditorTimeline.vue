<template>
  <div class="editor-timeline" :style="{ height: timelineHeight + 'px' }" @click="handleClick">
    <!-- Render Notes -->
    <GeometricNote
      v-for="note in chart.notes"
      :key="'note-' + note.id"
      :note="note"
      :lookaheadTime="850"
      :viewportHeight="100"
      class="timeline-item note-wrapper"
      :class="{ selected: note.id === selectedNoteId }"
      :style="getItemStyle(note)"
      @click.stop="selectNote(note.id)"
      @mousedown.prevent="startDrag(note, $event)"
    >
      <div
        v-if="note.type === 'hold'"
        class="resize-handle"
        @mousedown.stop.prevent="startResize(note, $event)"
      ></div>
    </GeometricNote>

    <!-- Render Events -->
    <div
      v-for="(event, index) in chart.events"
      :key="'event-' + index"
      class="timeline-item event-wrapper"
      :class="{ selected: index === selectedEventIndex }"
      :style="getItemStyle(event)"
      @click.stop="selectEvent(index)"
    >
      <JudgmentLine :y="event.y" :rotation="event.rotation" />
    </div>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';
import JudgmentLine from './JudgmentLine.vue';

export default {
  name: 'EditorTimeline',
  components: { GeometricNote, JudgmentLine },
  props: {
    chart: { type: Object, required: true },
    selectedNoteId: { type: [Number, null], default: null },
    selectedEventIndex: { type: [Number, null], default: null },
  },
  emits: ['addNote', 'selectNote', 'updateNote', 'selectEvent'],
  data() {
    return {
      pixelsPerSecond: 100, // 100px represents 1 second
      draggingNote: null,
      dragStartX: 0,
      dragStartY: 0,
      resizingNote: null,
      resizeStartY: 0,
    };
  },
  computed: {
    songDurationMs() {
      // Find the time of the last note or event to determine total duration
      const lastNoteTime = this.chart.notes.reduce((max, n) => Math.max(max, n.time + (n.duration || 0)), 0);
      const lastEventTime = this.chart.events.reduce((max, e) => Math.max(max, e.time), 0);
      return Math.max(lastNoteTime, lastEventTime);
    },
    timelineHeight() {
      return (this.songDurationMs / 1000) * this.pixelsPerSecond;
    },
  },
  methods: {
    getItemStyle(item) {
      const top = (item.time / 1000) * this.pixelsPerSecond;
      const style = {
        top: `${top}px`,
      };
      if ('x' in item) { // For notes
        style.left = `${item.x}%`;
        // The transform is now handled by the GeometricNote component, but we need it for positioning the wrapper
        style.transform = 'translateX(-50%)';
      }
      // The height for hold notes is now handled internally by GeometricNote based on our faked props.
      // We no longer set it here.
      return style;
    },
    selectNote(noteId) {
      // Emit an event to the parent to update the selection
      if (!this.draggingNote) {
        this.$emit('selectNote', noteId);
      }
    },
    startDrag(note, event) {
      this.draggingNote = {
        ...note,
        initialTime: note.time,
        initialX: note.x
      };
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;

      window.addEventListener('mousemove', this.onDrag);
      window.addEventListener('mouseup', this.stopDrag);
    },
    onDrag(event) {
      if (!this.draggingNote) return;

      const rect = this.$el.getBoundingClientRect();
      const timeOffset = (event.clientY - this.dragStartY) / this.pixelsPerSecond * 1000;
      const xOffset = (event.clientX - this.dragStartX) / rect.width * 100;

      const newTime = this.draggingNote.initialTime + timeOffset;
      const newX = this.draggingNote.initialX + xOffset;

      // Update the note in the parent component in real-time
      this.$emit('updateNote', {
        id: this.draggingNote.id,
        time: Math.round(newTime),
        x: Math.max(0, Math.min(100, newX)), // Clamp x between 0 and 100
      });
    },
    stopDrag() {
      window.removeEventListener('mousemove', this.onDrag);
      window.removeEventListener('mouseup', this.stopDrag);

      // A short timeout to prevent click event from firing after drag
      setTimeout(() => {
        this.draggingNote = null;
      }, 10);
    },
    startResize(note, event) {
      this.resizingNote = {
        ...note,
        initialDuration: note.duration,
      };
      this.resizeStartY = event.clientY;
      window.addEventListener('mousemove', this.onResize);
      window.addEventListener('mouseup', this.stopResize);
    },
    onResize(event) {
      if (!this.resizingNote) return;

      const heightOffset = event.clientY - this.resizeStartY;
      const durationOffset = (heightOffset / this.pixelsPerSecond) * 1000;
      const newDuration = this.resizingNote.initialDuration + durationOffset;

      this.$emit('updateNote', {
        id: this.resizingNote.id,
        duration: Math.max(50, Math.round(newDuration)), // Minimum duration 50ms
      });
    },
    stopResize() {
      window.removeEventListener('mousemove', this.onResize);
      window.removeEventListener('mouseup', this.stopResize);
      this.resizingNote = null;
    },
    selectEvent(index) {
      this.$emit('selectEvent', index);
    },
    handleClick(event) {
      // If the click is on the timeline background, deselect any selected note
      if (event.target === event.currentTarget && !this.draggingNote) {
        this.$emit('selectNote', null);

        // Also proceed to add a new note
        const rect = event.currentTarget.getBoundingClientRect();
        const time = (event.clientY - rect.top) / this.pixelsPerSecond * 1000;
        const x = (event.clientX - rect.left) / rect.width * 100;
        this.$emit('addNote', { time, x });
      }
    },
  },
};
</script>

<style scoped>
.editor-timeline {
  position: relative;
  width: 100%;
  border-left: 1px solid #444;
  border-right: 1px solid #444;
  background-color: #111; /* Darker base for the grid */
  background-image:
    linear-gradient(rgba(128, 0, 128, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(128, 0, 128, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: bg-scroll 20s linear infinite;
}

@keyframes bg-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

.timeline-item {
  position: absolute;
  box-sizing: border-box;
}

.note-wrapper {
  /* This wrapper helps with positioning and applying effects without messing with the component's internal styles */
  z-index: 10;
  cursor: grab;
}

.note-wrapper.selected {
  /* The GLOW effect */
  filter: drop-shadow(0 0 4px #ff00ff) drop-shadow(0 0 12px #ff00ff);
  z-index: 20; /* Bring selected notes to the front */
}

.resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 8px;
  cursor: ns-resize;
  z-index: 25; /* Above the note itself */
}

.event-wrapper {
  width: 100%;
  height: 100px; /* Represents the in-game viewport height */
  left: 0;
  z-index: 5;
  cursor: pointer;
  /* Add a subtle border to make the area clickable and visible */
  border-top: 1px dashed rgba(255, 165, 0, 0.5);
  transform: translateY(-50px); /* Center the viewport on the time marker */
}

.event-wrapper:hover {
  background-color: rgba(255, 165, 0, 0.1);
}

.event-wrapper.selected {
  /* Use a glow effect on the border to indicate selection */
  border-top: 1px dashed #ff00ff;
  box-shadow: 0 -10px 20px -10px #ff00ff, 0 10px 20px -10px #ff00ff;
}
</style>
