<template>
  <div class="chart-editor">
    <div class="editor-header">
      <h1>Chart Editor</h1>
      <div class="editor-toolbar">
        <label for="note-type-select">Note Type:</label>
        <select id="note-type-select" v-model="currentNoteType">
          <option value="tap">Tap</option>
          <option value="hold">Hold</option>
        </select>
        <button @click="addEvent">Add Event</button>
        <button @click="deleteSelectedNote" :disabled="!selectedNoteId" class="delete-button">Delete Note</button>
        <button @click="deleteSelectedEvent" :disabled="selectedEventIndex === null" class="delete-button">Delete Event</button>
        <button @click="$emit('exit')">Back to Menu</button>
      </div>
    </div>
    <div class="editor-main">
      <div class="editor-content">
        <div v-if="localChart" class="timeline-container">
          <EditorTimeline
             :chart="localChart"
             :selected-note-id="selectedNoteId"
             :selected-event-index="selectedEventIndex"
             @addNote="addNote"
             @selectNote="handleSelectNote"
             @updateNote="handleUpdateNote"
             @selectEvent="handleSelectEvent"
        />
      </div>
      <div v-else>
        <p>Loading chart data...</p>
      </div>
    </div>
    <div v-if="selectedNote || selectedEvent" class="editor-sidebar">
      <div v-if="selectedNote">
        <h3>Note Properties</h3>
        <div class="property">
          <label for="note-time">Time (ms)</label>
          <input id="note-time" type="number" v-model.number="selectedNote.time">
        </div>
        <div class="property">
          <label for="note-x">X Position (%)</label>
          <input id="note-x" type="number" v-model.number="selectedNote.x">
        </div>
        <div v-if="selectedNote.type === 'hold'" class="property">
          <label for="note-duration">Duration (ms)</label>
          <input id="note-duration" type="number" v-model.number="selectedNote.duration">
        </div>
      </div>
      <div v-if="selectedEvent">
        <h3>Event Properties</h3>
        <div class="property">
          <label for="event-time">Time (ms)</label>
          <input id="event-time" type="number" v-model.number="selectedEvent.time">
        </div>
        <div class="property">
          <label for="event-y">Y Position (%)</label>
          <input id="event-y" type="number" v-model.number="selectedEvent.y">
        </div>
        <div class="property">
          <label for="event-rotation">Rotation (deg)</label>
          <input id="event-rotation" type="number" v-model.number="selectedEvent.rotation">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EditorTimeline from '../components/EditorTimeline.vue';

export default {
  name: 'ChartEditor',
  components: { EditorTimeline },
  props: {
    chartUrl: { type: String, required: true },
    chartData: { type: Object, default: null },
  },
  emits: ['exit', 'chartLoaded'],
  data() {
    return {
      localChart: null,
      selectedNoteId: null,
      currentNoteType: 'tap',
      selectedEventIndex: null,
    };
  },
  mounted() {
    this.loadChart();
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  computed: {
    selectedNote() {
      if (this.selectedNoteId === null || !this.localChart) return null;
      return this.localChart.notes.find(note => note.id === this.selectedNoteId);
    },
    selectedEvent() {
      if (this.selectedEventIndex === null || !this.localChart) return null;
      return this.localChart.events[this.selectedEventIndex];
    }
  },
  methods: {
    async loadChart() {
      try {
        let chartJson;
        if (this.chartData) {
          chartJson = this.chartData;
        } else {
          if (!this.chartUrl) return;
          const response = await fetch(this.chartUrl);
          chartJson = await response.json();
        }
        // Deep copy the loaded chart to a local state for editing
        this.localChart = JSON.parse(JSON.stringify(chartJson));

        // Emit the original loaded data for caching
        this.$emit('chartLoaded', { url: this.chartUrl, data: chartJson });
      } catch (error) {
        console.error("Failed to load chart for editor:", error);
      }
    },
    addNote({ time, x }) {
      if (!this.localChart) return;

      const newId = this.localChart.notes.length > 0
        ? Math.max(...this.localChart.notes.map(n => n.id)) + 1
        : 1;

      const newNote = {
        id: newId,
        type: this.currentNoteType,
        time: Math.round(time),
        x: Math.round(x),
      };

      if (newNote.type === 'hold') {
        newNote.duration = 500; // Default duration of 500ms
      }

      this.localChart.notes.push(newNote);
      // Optional: Sort notes by time after adding
      this.localChart.notes.sort((a, b) => a.time - b.time);
    },
    handleSelectNote(noteId) {
      if (this.selectedNoteId === noteId) {
        // If the same note is clicked again, deselect it
        this.selectedNoteId = null;
      } else {
        this.selectedNoteId = noteId;
        this.selectedEventIndex = null; // Deselect any selected event
      }
    },
    handleSelectEvent(index) {
      if (this.selectedEventIndex === index) {
        this.selectedEventIndex = null;
      } else {
        this.selectedEventIndex = index;
        this.selectedNoteId = null; // Deselect any selected note
      }
    },
    handleUpdateNote(updatedNote) {
      if (!this.localChart) return;
      const note = this.localChart.notes.find(n => n.id === updatedNote.id);
      if (note) {
        Object.assign(note, updatedNote);
      }
    },
    deleteSelectedNote() {
      if (!this.selectedNoteId) return;

      const noteIndex = this.localChart.notes.findIndex(note => note.id === this.selectedNoteId);
      if (noteIndex > -1) {
        this.localChart.notes.splice(noteIndex, 1);
        this.selectedNoteId = null; // Deselect after deletion
      }
    },
    addEvent() {
      if (!this.localChart) return;

      const events = this.localChart.events;
      const lastEvent = events.length > 0 ? events[events.length - 1] : { time: 0, y: 50, rotation: 0 };

      const newEvent = {
        time: lastEvent.time + 1000, // Add 1 second after the last event
        y: lastEvent.y,
        rotation: lastEvent.rotation
      };

      events.push(newEvent);
      // Ensure events are sorted by time
      events.sort((a, b) => a.time - b.time);
      // Select the newly added event
      this.selectedEventIndex = events.indexOf(newEvent);
      this.selectedNoteId = null;
    },
    deleteSelectedEvent() {
      if (this.selectedEventIndex === null) return;

      this.localChart.events.splice(this.selectedEventIndex, 1);
      this.selectedEventIndex = null;
    },
    handleKeyDown(event) {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.selectedNoteId !== null) {
          this.deleteSelectedNote();
        } else if (this.selectedEventIndex !== null) {
          this.deleteSelectedEvent();
        }
      }
    },
  },
};
</script>

<style scoped>
.chart-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #111;
  color: #fff;
}

.editor-main {
  display: flex;
  flex-grow: 1;
  overflow: hidden; /* Prevent parent from growing due to children */
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #222;
  border-bottom: 2px solid #00ffff;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.editor-toolbar label {
  font-weight: bold;
}

.editor-toolbar select {
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 5px;
  border-radius: 4px;
}

h1 {
  margin: 0;
  font-size: 24px;
}

button {
  padding: 8px 15px;
  /* ... standard button styles */
}

.delete-button {
  background-color: #ff3b30;
  color: white;
  border: 1px solid #ff3b30;
  margin-right: 10px;
}

.delete-button:disabled {
  background-color: #555;
  border-color: #555;
  cursor: not-allowed;
}

.editor-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}

.editor-sidebar {
  width: 250px;
  flex-shrink: 0;
  padding: 20px;
  background-color: #1a1a1a;
  border-left: 2px solid #00ffff;
  overflow-y: auto;
}

.editor-sidebar h3 {
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}

.property {
  margin-bottom: 15px;
}

.property label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
  color: #aaa;
}

.property input {
  width: 100%;
  padding: 8px;
  background-color: #333;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
}

.timeline-container {
  /* Placeholder styles */
  border: 1px dashed #555;
  padding: 20px;
}
</style>
