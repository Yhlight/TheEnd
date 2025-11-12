<template>
  <div class="chart-editor">
    <div class="editor-header">
      <h1>Chart Editor</h1>
      <div>
        <button @click="deleteSelectedNote" :disabled="!selectedNoteId" class="delete-button">Delete Note</button>
        <button @click="$emit('exit')">Back to Menu</button>
      </div>
    </div>
    <div class="editor-content">
      <div v-if="localChart" class="timeline-container">
        <EditorTimeline
          :chart="localChart"
          :selected-note-id="selectedNoteId"
          @addNote="addNote"
          @selectNote="handleSelectNote"
        />
      </div>
      <div v-else>
        <p>Loading chart data...</p>
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
    };
  },
  mounted() {
    this.loadChart();
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
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
        type: 'tap',
        time: Math.round(time),
        x: Math.round(x),
      };

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
    handleKeyDown(event) {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        this.deleteSelectedNote();
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

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #222;
  border-bottom: 2px solid #00ffff;
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

.timeline-container {
  /* Placeholder styles */
  border: 1px dashed #555;
  padding: 20px;
}
</style>
