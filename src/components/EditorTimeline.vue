<template>
  <div class="editor-timeline" :style="{ height: timelineHeight + 'px' }">
    <!-- Render Notes -->
    <div
      v-for="note in chart.notes"
      :key="'note-' + note.id"
      class="timeline-item note"
      :class="note.type"
      :style="getItemStyle(note)"
    >
      {{ note.type }}
    </div>

    <!-- Render Events -->
    <div
      v-for="(event, index) in chart.events"
      :key="'event-' + index"
      class="timeline-item event"
      :style="getItemStyle(event)"
    >
      Event: y={{ event.y }}, rot={{ event.rotation }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditorTimeline',
  props: {
    chart: { type: Object, required: true },
  },
  data() {
    return {
      pixelsPerSecond: 100, // 100px represents 1 second
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
      if (item.x) { // For notes
        style.left = `${item.x}%`;
        style.transform = 'translateX(-50%)';
      }
      if (item.duration) { // For hold notes
        style.height = (item.duration / 1000) * this.pixelsPerSecond + 'px';
      }
      return style;
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
.note.tap { background-color: rgba(0, 255, 255, 0.3); border-color: #00ffff; }
.note.hold { background-color: rgba(255, 0, 255, 0.3); border-color: #ff00ff; }
.note.swipe { background-color: rgba(255, 255, 0, 0.3); border-color: #ffff00; }
.note.catch { background-color: rgba(0, 255, 0, 0.3); border-color: #00ff00; width: 100px; height: 4px; }

.event {
  width: 95%;
  left: 2.5%;
  background-color: rgba(255, 165, 0, 0.2);
  border-top: 1px dashed orange;
  color: orange;
  z-index: 5;
  text-align: right;
}
</style>
