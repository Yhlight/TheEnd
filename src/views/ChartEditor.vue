<template>
  <div class="chart-editor">
    <div class="audio-controls">
      <button @click="toggleAudioPlayback">{{ isPlaying ? 'Pause' : 'Play' }}</button>
      <span>{{ formatTime(audioCurrentTime) }} / {{ formatTime(audioDuration) }}</span>
      <input
        type="range"
        class="progress-bar"
        :value="audioCurrentTime"
        :max="audioDuration"
        @input="seekAudio"
      >
      <audio ref="audioPlayer" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata"></audio>
    </div>
    <div class="editor-header">
      <h1>Chart Editor</h1>
      <div class="editor-toolbar">
        <label for="note-type-select">Note Type:</label>
        <select id="note-type-select" v-model="currentNoteType">
          <option value="tap">Tap</option>
          <option value="hold">Hold</option>
          <option value="swipe">Swipe</option>
          <option value="catch">Catch</option>
        </select>
        <button @click="addEvent">Add Event</button>
        <button @click="exportChart" class="export-button">Export Chart</button>
        <button @click="deleteSelectedNote" :disabled="!selectedNoteId" class="delete-button">Delete Note</button>
        <button @click="deleteSelectedEvent" :disabled="selectedEventIndex === null" class="delete-button">Delete Event</button>
        <button @click="$emit('exit')">Back to Menu</button>
      </div>
    </div>
    <div class="editor-main">
      <div class="editor-content">
        <div v-if="localChart" class="timeline-container">
          <div class="playhead" :style="playheadStyle"></div>
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
    <div v-if="localChart" class="editor-sidebar">
      <div class="sidebar-section">
        <h3>Chart Metadata</h3>
        <div class="property">
          <label for="chart-title">Song Title</label>
          <input id="chart-title" type="text" v-model="localChart.title">
        </div>
        <div class="property">
          <label for="chart-artist">Artist</label>
          <input id="chart-artist" type="text" v-model="localChart.artist">
        </div>
      </div>
      <div v-if="selectedNote" class="sidebar-section">
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
      <div v-if="selectedEvent" class="sidebar-section">
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
      isPlaying: false,
      audioCurrentTime: 0,
      audioDuration: 0,
    };
  },
  mounted() {
    this.loadChart();
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  watch: {
    audioCurrentTime(newTime) {
      if (this.isPlaying) {
        this.autoscrollTimeline(newTime);
      }
    }
  },
  computed: {
    selectedNote() {
      if (this.selectedNoteId === null || !this.localChart) return null;
      return this.localChart.notes.find(note => note.id === this.selectedNoteId);
    },
    selectedEvent() {
      if (this.selectedEventIndex === null || !this.localChart) return null;
      return this.localChart.events[this.selectedEventIndex];
    },
    playheadStyle() {
      // This value must match the one in EditorTimeline.vue
      const pixelsPerSecond = 100;
      // audioCurrentTime is in seconds, so this calculation is correct
      const top = this.audioCurrentTime * pixelsPerSecond;
      return {
        // We add the padding of the timeline-container
        transform: `translateY(${top + 20}px)`
      };
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

        // Load the audio for the chart
        this.$nextTick(() => {
          const audio = this.$refs.audioPlayer;
          audio.src = this.localChart.audioUrl;
          audio.load();
        });
      } catch (error) {
        console.error("Failed to load chart for editor:", error);
      }
    },
    toggleAudioPlayback() {
      const audio = this.$refs.audioPlayer;
      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      this.isPlaying = !this.isPlaying;
    },
    onTimeUpdate() {
      this.audioCurrentTime = this.$refs.audioPlayer.currentTime;
    },
    onLoadedMetadata() {
      this.audioDuration = this.$refs.audioPlayer.duration;
    },
    seekAudio(event) {
      const time = event.target.value;
      this.$refs.audioPlayer.currentTime = time;
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    autoscrollTimeline(currentTime) {
      const pixelsPerSecond = 100; // Must match EditorTimeline
      const timelineContainer = this.$el.querySelector('.timeline-container');
      const editorContent = this.$el.querySelector('.editor-content');
      if (!timelineContainer || !editorContent) return;

      const playheadPx = currentTime * pixelsPerSecond;
      const viewHeight = editorContent.clientHeight;

      // Target position: center of the viewport
      const targetScrollTop = playheadPx - (viewHeight / 2);

      // Smoothly scroll towards the target
      editorContent.scrollTop += (targetScrollTop - editorContent.scrollTop) * 0.1;
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
    exportChart() {
      if (!this.localChart) return;

      const chartJson = JSON.stringify(this.localChart, null, 2);
      const blob = new Blob([chartJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.localChart.title || 'chart'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
/* Base */
.chart-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0d0d0d; /* Even darker base */
  color: #e0e0e0;
  font-family: 'Segoe UI', sans-serif; /* A more geometric font */
}

/* Header & Toolbar */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #1a1a1a;
  border-bottom: 2px solid #ff00ff;
  box-shadow: 0 0 15px #ff00ff;
}

h1 {
  margin: 0;
  font-size: 24px;
  text-shadow: 0 0 5px #ff00ff;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* Main Content Area */
.editor-main {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.editor-content {
  flex-grow: 1;
  overflow-y: auto;
  /* Custom scrollbar to match aesthetic */
  scrollbar-width: thin;
  scrollbar-color: #ff00ff #1a1a1a;
}

.timeline-container {
  position: relative;
  border: none; /* Remove the dashed border */
  padding: 20px 0; /* Adjust padding */
}

/* Sidebar */
.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  padding: 20px;
  background-color: #1a1a1a;
  border-left: 2px solid #00ffff;
  box-shadow: 0 0 15px #00ffff;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ffff #1a1a1a;
}

.editor-sidebar h3 {
  margin-top: 0;
  border-bottom: 1px solid #00ffff;
  padding-bottom: 10px;
  text-shadow: 0 0 5px #00ffff;
}

.sidebar-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #444;
}
.sidebar-section:first-child { margin-top: 0; padding-top: 0; border-top: none; }

/* Form Elements */
button, select {
  background: transparent;
  border: 2px solid #e0e0e0;
  color: #e0e0e0;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-transform: uppercase;
  letter-spacing: 1px;
}

button:hover, select:hover {
  border-color: #ff00ff;
  color: #ff00ff;
  box-shadow: 0 0 10px #ff00ff;
}

.export-button { border-color: #34c759; color: #34c759; }
.export-button:hover { box-shadow: 0 0 10px #34c759; }
.delete-button { border-color: #ff3b30; color: #ff3b30; }
.delete-button:hover { box-shadow: 0 0 10px #ff3b30; }
.delete-button:disabled {
  border-color: #555;
  color: #555;
  cursor: not-allowed;
  box-shadow: none;
}

.property label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
  color: #aaa;
  text-transform: uppercase;
}

.property input, .editor-toolbar select {
  width: 100%;
  padding: 8px;
  background-color: #0d0d0d;
  border: 2px solid #555;
  color: #e0e0e0;
  transition: all 0.2s ease;
}

.property input:focus, .editor-toolbar select:focus {
  outline: none;
  border-color: #00ffff;
  box-shadow: 0 0 10px #00ffff;
}

/* Audio Controls */
.audio-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  background-color: #1a1a1a;
  border-bottom: 1px solid #444;
}

.progress-bar {
  flex-grow: 1;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: #444;
  outline: none;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #00ffff;
  cursor: pointer;
  border: 2px solid #0d0d0d;
  box-shadow: 0 0 10px #00ffff;
}
.progress-bar::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #00ffff;
  cursor: pointer;
  border: 2px solid #0d0d0d;
  box-shadow: 0 0 10px #00ffff;
}


/* Playhead */
.playhead {
  position: absolute;
  left: 0;
  top: 0; /* The transform will handle the Y positioning */
  width: 100%;
  height: 4px;
  background-color: #00ffff;
  box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
  z-index: 50;
  pointer-events: none;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff; }
  50% { box-shadow: 0 0 15px #00ffff, 0 0 30px #00ffff; }
  100% { box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff; }
}
</style>
