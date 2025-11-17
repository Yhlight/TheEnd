<template>
  <div class="editor-timeline" :style="{ height: timelineHeight + 'px' }" @click="handleClick">
    <!-- Render Notes -->
    <div
      v-for="note in chart.notes"
      :key="'note-' + note.id"
      class="timeline-item note"
      :class="[note.type, { selected: note.id === selectedNoteId }]"
      :style="getItemStyle(note)"
      @click.stop="selectNote(note.id)"
      @mousedown.prevent="startDrag(note, $event)"
    >
      {{ note.type }}
      <div
        v-if="note.type === 'hold'"
        class="resize-handle"
        @mousedown.stop.prevent="startResize(note, $event)"
      ></div>
    </div>

    <!-- Render Events -->
    <div
      v-for="(event, index) in chart.events"
      :key="'event-' + index"
      class="timeline-item event"
      :class="{ selected: index === selectedEventIndex }"
      :style="getItemStyle(event)"
      @click.stop="selectEvent(index)"
      @mousedown.prevent="startEventDrag(index, $event)"
    >
      Event: y={{ event.y }}, rot={{ event.rotation }}
    </div>

    <!-- Render Camera Events -->
    <div
      v-for="(event, index) in chart.cameraEvents"
      :key="'camera-event-' + index"
      class="timeline-item camera-event"
      :class="{ selected: index === selectedCameraEventIndex }"
      :style="getItemStyle(event)"
      @click.stop="selectCameraEvent(index)"
      @mousedown.prevent="startCameraEventDrag(index, $event)"
    >
      &#x25C6;
    </div>

    <!-- Render FX Events -->
    <div
      v-for="(event, index) in chart.fxEvents"
      :key="'fx-event-' + index"
      class="timeline-item fx-event"
      :class="{ selected: index === selectedFxEventIndex }"
      :style="getItemStyle(event)"
      @click.stop="selectFxEvent(index)"
      @mousedown.prevent="startFxEventDrag(index, $event)"
    >
      &#9733;
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditorTimeline',
  props: {
    chart: { type: Object, required: true },
    selectedNoteId: { type: [Number, null], default: null },
    selectedEventIndex: { type: [Number, null], default: null },
    selectedCameraEventIndex: { type: [Number, null], default: null },
    selectedFxEventIndex: { type: [Number, null], default: null },
  },
  emits: ['addNote', 'selectNote', 'updateNote', 'selectEvent', 'updateEvent', 'selectCameraEvent', 'updateCameraEvent', 'selectFxEvent', 'updateFxEvent'],
  data() {
    return {
      pixelsPerSecond: 100, // 100px represents 1 second
      draggingNote: null,
      dragStartX: 0,
      dragStartY: 0,
      resizingNote: null,
      resizeStartY: 0,
      draggingEvent: null,
      draggingCameraEvent: null,
      draggingFxEvent: null,
    };
  },
  computed: {
    songDurationMs() {
      // Find the time of the last note or event to determine total duration
      const lastNoteTime = this.chart.notes.reduce((max, n) => Math.max(max, n.time + (n.duration || 0)), 0);
      const lastEventTime = this.chart.events.reduce((max, e) => Math.max(max, e.time), 0);
      const lastCameraEventTime = this.chart.cameraEvents?.reduce((max, e) => Math.max(max, e.time), 0) || 0;
      const lastFxEventTime = this.chart.fxEvents?.reduce((max, e) => Math.max(max, e.time), 0) || 0;
      return Math.max(lastNoteTime, lastEventTime, lastCameraEventTime, lastFxEventTime);
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
      if (item.x) { // For notes
        style.left = `${item.x}%`;
        style.transform = 'translateX(-50%)';
      }
      if (item.duration) { // For hold notes
        style.height = (item.duration / 1000) * this.pixelsPerSecond + 'px';
      }
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
      if (!this.draggingEvent) {
        this.$emit('selectEvent', index);
      }
    },
    startEventDrag(index, event) {
      this.draggingEvent = {
        index: index,
        initialTime: this.chart.events[index].time,
        dragStartY: event.clientY,
      };
      window.addEventListener('mousemove', this.onEventDrag);
      window.addEventListener('mouseup', this.stopEventDrag);
    },
    onEventDrag(event) {
      if (!this.draggingEvent) return;

      const timeOffset = (event.clientY - this.draggingEvent.dragStartY) / this.pixelsPerSecond * 1000;
      const newTime = this.draggingEvent.initialTime + timeOffset;

      this.$emit('updateEvent', {
        index: this.draggingEvent.index,
        time: Math.max(0, Math.round(newTime)), // Prevent negative time
      });
    },
    stopEventDrag() {
      window.removeEventListener('mousemove', this.onEventDrag);
      window.removeEventListener('mouseup', this.stopEventDrag);
      setTimeout(() => {
        this.draggingEvent = null;
      }, 10);
    },
    selectCameraEvent(index) {
      if (!this.draggingCameraEvent) {
        this.$emit('selectCameraEvent', index);
      }
    },
    startCameraEventDrag(index, event) {
      this.draggingCameraEvent = {
        index: index,
        initialTime: this.chart.cameraEvents[index].time,
        dragStartY: event.clientY,
      };
      window.addEventListener('mousemove', this.onCameraEventDrag);
      window.addEventListener('mouseup', this.stopCameraEventDrag);
    },
    onCameraEventDrag(event) {
      if (!this.draggingCameraEvent) return;

      const timeOffset = (event.clientY - this.draggingCameraEvent.dragStartY) / this.pixelsPerSecond * 1000;
      const newTime = this.draggingCameraEvent.initialTime + timeOffset;

      this.$emit('updateCameraEvent', {
        index: this.draggingCameraEvent.index,
        time: Math.max(0, Math.round(newTime)),
      });
    },
    stopCameraEventDrag() {
      window.removeEventListener('mousemove', this.onCameraEventDrag);
      window.removeEventListener('mouseup', this.stopCameraEventDrag);
      setTimeout(() => {
        this.draggingCameraEvent = null;
      }, 10);
    },
    selectFxEvent(index) {
      if (!this.draggingFxEvent) {
        this.$emit('selectFxEvent', index);
      }
    },
    startFxEventDrag(index, event) {
      this.draggingFxEvent = {
        index: index,
        initialTime: this.chart.fxEvents[index].time,
        dragStartY: event.clientY,
      };
      window.addEventListener('mousemove', this.onFxEventDrag);
      window.addEventListener('mouseup', this.stopFxEventDrag);
    },
    onFxEventDrag(event) {
      if (!this.draggingFxEvent) return;

      const timeOffset = (event.clientY - this.draggingFxEvent.dragStartY) / this.pixelsPerSecond * 1000;
      const newTime = this.draggingFxEvent.initialTime + timeOffset;

      this.$emit('updateFxEvent', {
        index: this.draggingFxEvent.index,
        time: Math.max(0, Math.round(newTime)),
      });
    },
    stopFxEventDrag() {
      window.removeEventListener('mousemove', this.onFxEventDrag);
      window.removeEventListener('mouseup', this.stopFxEventDrag);
      setTimeout(() => {
        this.draggingFxEvent = null;
      }, 10);
    },
    handleClick(event) {
      // If the click is on the timeline background, deselect everything
      if (event.target === event.currentTarget && !this.draggingNote && !this.draggingEvent && !this.draggingCameraEvent && !this.draggingFxEvent) {
        this.$emit('selectNote', null);
        this.$emit('selectEvent', null);
        this.$emit('selectCameraEvent', null);
        this.$emit('selectFxEvent', null);

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
  background-color: #222;
  border-left: 1px solid #444;
  border-right: 1px solid #444;
}

.timeline-item {
  position: absolute;
  width: 80px;
  padding: 2px 5px;
  font-size: 12px;
  border-radius: 3px;
  box-sizing: border-box;
}

.note {
  border: 1px solid;
}
.note {
  border: 1px solid #fff;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  text-shadow: 0 0 5px #fff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  transition: all 0.2s;
}
.note.tap, .note.swipe, .note.hold { width: 80px; }
.note.catch { width: 120px; height: 4px; }
.note.hold { background-color: rgba(255, 255, 255, 0.05); }

.note:hover {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
}

.note.selected {
  border: 2px solid #ff3b30;
  background-color: rgba(255, 59, 48, 0.3);
  box-shadow: 0 0 15px #ff3b30, 0 0 25px #ff3b30;
  z-index: 10;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 8px;
  cursor: ns-resize;
  background-color: rgba(255, 255, 255, 0.3);
}

.event {
  width: 95%;
  left: 2.5%;
  background-color: rgba(0, 255, 255, 0.1);
  border-top: 1px dashed #00ffff;
  color: #00ffff;
  text-shadow: 0 0 5px #00ffff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  z-index: 5;
  text-align: right;
  cursor: pointer;
  transition: all 0.2s;
}

.event:hover {
  background-color: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
}

.event.selected {
  border-top: 2px solid #ff3b30;
  background-color: rgba(255, 59, 48, 0.3);
  box-shadow: 0 0 15px #ff3b30, 0 0 25px #ff3b30;
}

.camera-event {
  width: 20px;
  height: 20px;
  left: 5px; /* Position on the left side of the timeline */
  transform: translateX(0);
  background-color: transparent;
  color: #ff9500; /* Orange color */
  font-size: 20px;
  text-shadow: 0 0 5px #ff9500;
  cursor: pointer;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-event.selected {
  color: #ff3b30;
  text-shadow: 0 0 10px #ff3b30;
}

.fx-event {
  width: 20px;
  height: 20px;
  right: 5px; /* Position on the right side of the timeline */
  transform: translateX(0);
  background-color: transparent;
  color: #5856d6; /* Indigo color */
  font-size: 20px;
  text-shadow: 0 0 5px #5856d6;
  cursor: pointer;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fx-event.selected {
  color: #ff3b30;
  text-shadow: 0 0 10px #ff3b30;
}
</style>
