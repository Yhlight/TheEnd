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
        <button @click="deleteSelectedEvent" :disabled="selectedEventIndex === null" class="delete-button">Delete Line Event</button>
        <button @click="deleteSelectedCameraEvent" :disabled="selectedCameraEventIndex === null" class="delete-button">Delete Cam Event</button>
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
             :selected-camera-event-index="selectedCameraEventIndex"
             @addNote="addNote"
             @selectNote="handleSelectNote"
             @updateNote="handleUpdateNote"
             @selectEvent="handleSelectEvent"
             @updateEvent="handleUpdateEvent"
             @selectCameraEvent="selectCameraEvent"
             @updateCameraEvent="handleUpdateCameraEvent"
        />
        </div>
        <div v-else>
          <p>Loading chart data...</p>
        </div>
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
        <div class="property">
          <label for="chart-audio-url">Audio URL</label>
          <input id="chart-audio-url" type="text" v-model="localChart.audioUrl">
        </div>
        <div class="property">
          <label for="chart-cover-url">Cover Image URL</label>
          <input id="chart-cover-url" type="text" v-model="localChart.coverUrl">
        </div>
      </div>
      <div v-if="selectedNote" class="sidebar-section">
        <h3>Note Properties</h3>
        <div class="property">
          <label for="note-time">Time (ms)</label>
          <input id="note-time" type="number" v-model.number="selectedNote.time">
        </div>
        <div v-if="!isNoteDynamic" class="property">
          <label for="note-x">X Position (%)</label>
          <input id="note-x" type="number" v-model.number="selectedNote.x">
          <button @click="convertToDynamicNote" class="small-button">Convert to Dynamic</button>
        </div>
        <div v-else class="property keyframes-list">
          <label>X Keyframes</label>
          <div v-for="(keyframe, index) in selectedNote.x" :key="index" class="keyframe-item">
            <input type="number" v-model.number="keyframe.time" placeholder="Time (ms)">
            <input type="number" v-model.number="keyframe.value" placeholder="X (%)">
            <select v-model="keyframe.transitionType">
              <option value="linear">Linear</option>
              <option value="jump">Jump</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In Out</option>
            </select>
            <button @click="removeNoteKeyframe(index)">Remove</button>
          </div>
          <button @click="addNoteKeyframe">Add Keyframe</button>
        </div>

        <!-- Rotation Properties -->
        <div v-if="!isNoteRotationDynamic" class="property">
          <label for="note-rotation">Rotation (deg)</label>
          <input id="note-rotation" type="number" v-model.number="selectedNote.rotation">
          <button @click="convertToDynamicRotation" class="small-button">Convert to Dynamic</button>
        </div>
        <div v-else class="property keyframes-list">
          <label>Rotation Keyframes</label>
          <div v-for="(keyframe, index) in selectedNote.rotation" :key="index" class="keyframe-item">
            <input type="number" v-model.number="keyframe.time" placeholder="Time (ms)">
            <input type="number" v-model.number="keyframe.value" placeholder="Rot (°)">
            <select v-model="keyframe.transitionType">
              <option value="linear">Linear</option>
              <option value="jump">Jump</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In Out</option>
            </select>
            <button @click="removeNoteRotationKeyframe(index)">Remove</button>
          </div>
          <button @click="addNoteRotationKeyframe">Add Keyframe</button>
        </div>

        <!-- Alpha Properties -->
        <div v-if="!isNoteAlphaDynamic" class="property">
            <label for="note-alpha">Alpha (Opacity)</label>
            <input id="note-alpha" type="range" min="0" max="1" step="0.05" v-model.number="selectedNote.alpha" />
            <span>{{ selectedNote.alpha !== undefined ? selectedNote.alpha.toFixed(2) : '1.00' }}</span>
            <button @click="convertToDynamicAlpha" class="small-button">Convert to Dynamic</button>
        </div>
        <div v-else class="property keyframes-list">
            <label>Alpha Keyframes</label>
            <div v-for="(keyframe, index) in selectedNote.alpha" :key="index" class="keyframe-item">
                <input type="number" v-model.number="keyframe.time" placeholder="Time (ms)">
                <input type="number" step="0.05" min="0" max="1" v-model.number="keyframe.value" placeholder="Alpha">
                <select v-model="keyframe.transitionType">
                    <option value="linear">Linear</option>
                    <option value="jump">Jump</option>
                    <option value="easeIn">Ease In</option>
                    <option value="easeOut">Ease Out</option>
                    <option value="easeInOut">Ease In Out</option>
                </select>
                <button @click="removeNoteAlphaKeyframe(index)">Remove</button>
            </div>
            <button @click="addNoteAlphaKeyframe">Add Keyframe</button>
        </div>

        <!-- Size Properties -->
        <div v-if="!isNoteSizeDynamic" class="property">
          <label for="note-size">Size (%)</label>
          <input id="note-size" type="number" step="10" min="0" v-model.number="selectedNote.size">
          <button @click="convertToDynamicSize" class="small-button">Convert to Dynamic</button>
        </div>
        <div v-else class="property keyframes-list">
            <label>Size Keyframes</label>
            <div v-for="(keyframe, index) in selectedNote.size" :key="index" class="keyframe-item">
                <input type="number" v-model.number="keyframe.time" placeholder="Time (ms)">
                <input type="number" step="10" min="0" v-model.number="keyframe.value" placeholder="Size (%)">
                <select v-model="keyframe.transitionType">
                    <option value="linear">Linear</option>
                    <option value="jump">Jump</option>
                    <option value="easeIn">Ease In</option>
                    <option value="easeOut">Ease Out</option>
                    <option value="easeInOut">Ease In Out</option>
                </select>
                <button @click="removeNoteSizeKeyframe(index)">Remove</button>
            </div>
            <button @click="addNoteSizeKeyframe">Add Keyframe</button>
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
        <div class="property">
          <label for="event-alpha">Alpha (Opacity)</label>
          <input id="event-alpha" type="range" min="0" max="1" step="0.1" v-model.number="selectedEvent.alpha" />
          <span>{{ selectedEvent.alpha.toFixed(1) }}</span>
        </div>
        <div class="property">
          <label for="event-bgspeed">BG Scroll Speed</label>
          <input id="event-bgspeed" type="number" min="0" step="0.1" v-model.number="selectedEvent.bgSpeed" />
        </div>
        <div class="property">
          <label for="event-bgcolor">BG Color</label>
          <input id="event-bgcolor" type="text" v-model="selectedEvent.bgColor" />
        </div>
        <div class="property">
          <label for="event-transition">Transition Type</label>
          <select id="event-transition" v-model="selectedEvent.transitionType">
            <option value="linear">Linear</option>
            <option value="jump">Jump</option>
            <option value="easeIn">Ease In</option>
            <option value="easeOut">Ease Out</option>
            <option value="easeInOut">Ease In Out</option>
          </select>
        </div>
      </div>
      <div class="sidebar-section">
        <h3>Camera Events</h3>
        <button @click="addCameraEvent">Add Camera Event</button>
        <div class="event-list">
          <div
            v-for="(event, index) in localChart.cameraEvents"
            :key="index"
            class="event-item"
            :class="{ selected: selectedCameraEventIndex === index }"
            @click="selectCameraEvent(index)"
          >
            {{ index }}: {{ event.time }}ms
          </div>
        </div>
      </div>
      <div v-if="selectedCameraEvent" class="sidebar-section">
        <h3>Camera Event Properties</h3>
        <div class="property">
          <label for="camera-event-time">Time (ms)</label>
          <input id="camera-event-time" type="number" v-model.number="selectedCameraEvent.time">
        </div>
        <div class="property">
          <label for="camera-event-zoom">Zoom</label>
          <input id="camera-event-zoom" type="number" step="0.1" v-model.number="selectedCameraEvent.zoom">
        </div>
        <div class="property">
          <label for="camera-event-rotation">Rotation (deg)</label>
          <input id="camera-event-rotation" type="number" v-model.number="selectedCameraEvent.rotation">
        </div>
        <div class="property">
          <label for="camera-event-transition">Transition Type</label>
          <select id="camera-event-transition" v-model="selectedCameraEvent.transitionType">
            <option value="linear">Linear</option>
            <option value="jump">Jump</option>
            <option value="easeIn">Ease In</option>
            <option value="easeOut">Ease Out</option>
            <option value="easeInOut">Ease In Out</option>
          </select>
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
      selectedCameraEventIndex: null,
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
    'localChart.audioUrl'(newUrl, oldUrl) {
      if (newUrl && newUrl !== oldUrl) {
        const audio = this.$refs.audioPlayer;
        audio.src = newUrl;
        audio.load();
        // Reset playback state
        this.isPlaying = false;
        this.audioCurrentTime = 0;
      }
    },
    audioCurrentTime(newTime) {
      if (this.isPlaying) {
        this.autoscrollTimeline(newTime);
      }
    }
  },
  computed: {
    isNoteDynamic() {
      return this.selectedNote && Array.isArray(this.selectedNote.x);
    },
    isNoteRotationDynamic() {
      return this.selectedNote && Array.isArray(this.selectedNote.rotation);
    },
    isNoteAlphaDynamic() {
      return this.selectedNote && Array.isArray(this.selectedNote.alpha);
    },
    isNoteSizeDynamic() {
      return this.selectedNote && Array.isArray(this.selectedNote.size);
    },
    selectedNote() {
      if (this.selectedNoteId === null || !this.localChart) return null;
      return this.localChart.notes.find(note => note.id === this.selectedNoteId);
    },
    selectedEvent() {
      if (this.selectedEventIndex === null || !this.localChart) return null;
      return this.localChart.events[this.selectedEventIndex];
    },
    selectedCameraEvent() {
      if (this.selectedCameraEventIndex === null || !this.localChart || !this.localChart.cameraEvents) return null;
      return this.localChart.cameraEvents[this.selectedCameraEventIndex];
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

        // Ensure cameraEvents array exists
        if (!this.localChart.cameraEvents) {
          this.localChart.cameraEvents = [];
        }

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
        this.selectedCameraEventIndex = null;
      }
    },
    handleSelectEvent(index) {
      if (this.selectedEventIndex === index) {
        this.selectedEventIndex = null;
      } else {
        this.selectedEventIndex = index;
        this.selectedNoteId = null; // Deselect any selected note
        this.selectedCameraEventIndex = null;
      }
    },
    selectCameraEvent(index) {
      if (this.selectedCameraEventIndex === index) {
        this.selectedCameraEventIndex = null;
      } else {
        this.selectedCameraEventIndex = index;
        this.selectedNoteId = null;
        this.selectedEventIndex = null;
      }
    },
    addCameraEvent() {
      if (!this.localChart) return;
      const newEvent = {
        time: Math.round(this.audioCurrentTime * 1000),
        zoom: 1,
        rotation: 0,
        transitionType: 'linear'
      };
      this.localChart.cameraEvents.push(newEvent);
      this.localChart.cameraEvents.sort((a, b) => a.time - b.time);
      this.selectedCameraEventIndex = this.localChart.cameraEvents.indexOf(newEvent);
    },
    deleteSelectedCameraEvent() {
      if (this.selectedCameraEventIndex !== null) {
        this.localChart.cameraEvents.splice(this.selectedCameraEventIndex, 1);
        this.selectedCameraEventIndex = null;
      }
    },
    handleUpdateNote(updatedNote) {
      if (!this.localChart) return;
      const note = this.localChart.notes.find(n => n.id === updatedNote.id);
      if (note) {
        Object.assign(note, updatedNote);
      }
    },
    convertToDynamicNote() {
      if (this.selectedNote && !this.isNoteDynamic) {
        this.selectedNote.x = [
          { time: this.selectedNote.time, value: this.selectedNote.x, transitionType: 'linear' }
        ];
      }
    },
    addNoteKeyframe() {
      if (this.selectedNote && Array.isArray(this.selectedNote.x)) {
        const lastKeyframe = this.selectedNote.x[this.selectedNote.x.length - 1];
        this.selectedNote.x.push({
          time: lastKeyframe ? lastKeyframe.time + 100 : this.selectedNote.time,
          value: lastKeyframe ? lastKeyframe.value : 50,
          transitionType: 'linear'
        });
        this.selectedNote.x.sort((a, b) => a.time - b.time);
      }
    },
    removeNoteKeyframe(index) {
      if (this.selectedNote && Array.isArray(this.selectedNote.x)) {
        if (this.selectedNote.x.length > 1) {
          this.selectedNote.x.splice(index, 1);
        } else {
          alert("A dynamic note must have at least one keyframe.");
        }
      }
    },
    convertToDynamicRotation() {
      if (this.selectedNote && !this.isNoteRotationDynamic) {
        const currentRotation = typeof this.selectedNote.rotation === 'number' ? this.selectedNote.rotation : 0;
        this.selectedNote.rotation = [
          { time: this.selectedNote.time, value: currentRotation, transitionType: 'linear' }
        ];
      }
    },
    addNoteRotationKeyframe() {
      if (this.selectedNote && Array.isArray(this.selectedNote.rotation)) {
        const lastKeyframe = this.selectedNote.rotation[this.selectedNote.rotation.length - 1];
        this.selectedNote.rotation.push({
          time: lastKeyframe ? lastKeyframe.time + 100 : this.selectedNote.time,
          value: lastKeyframe ? lastKeyframe.value : 0,
          transitionType: 'linear'
        });
        this.selectedNote.rotation.sort((a, b) => a.time - b.time);
      }
    },
    removeNoteRotationKeyframe(index) {
      if (this.selectedNote && Array.isArray(this.selectedNote.rotation)) {
        if (this.selectedNote.rotation.length > 1) {
          this.selectedNote.rotation.splice(index, 1);
        } else {
          alert("A dynamic rotation must have at least one keyframe.");
        }
      }
    },
    convertToDynamicAlpha() {
      if (this.selectedNote && !this.isNoteAlphaDynamic) {
        const currentAlpha = typeof this.selectedNote.alpha === 'number' ? this.selectedNote.alpha : 1.0;
        this.selectedNote.alpha = [
          { time: this.selectedNote.time, value: currentAlpha, transitionType: 'linear' }
        ];
      }
    },
    addNoteAlphaKeyframe() {
      if (this.selectedNote && Array.isArray(this.selectedNote.alpha)) {
        const lastKeyframe = this.selectedNote.alpha[this.selectedNote.alpha.length - 1];
        this.selectedNote.alpha.push({
          time: lastKeyframe ? lastKeyframe.time + 100 : this.selectedNote.time,
          value: lastKeyframe ? lastKeyframe.value : 1.0,
          transitionType: 'linear'
        });
        this.selectedNote.alpha.sort((a, b) => a.time - b.time);
      }
    },
    removeNoteAlphaKeyframe(index) {
      if (this.selectedNote && Array.isArray(this.selectedNote.alpha)) {
        if (this.selectedNote.alpha.length > 1) {
          this.selectedNote.alpha.splice(index, 1);
        } else {
          alert("A dynamic alpha must have at least one keyframe.");
        }
      }
    },
    convertToDynamicSize() {
      if (this.selectedNote && !this.isNoteSizeDynamic) {
        const currentSize = typeof this.selectedNote.size === 'number' ? this.selectedNote.size : 100;
        this.selectedNote.size = [
          { time: this.selectedNote.time, value: currentSize, transitionType: 'linear' }
        ];
      }
    },
    addNoteSizeKeyframe() {
      if (this.selectedNote && Array.isArray(this.selectedNote.size)) {
        const lastKeyframe = this.selectedNote.size[this.selectedNote.size.length - 1];
        this.selectedNote.size.push({
          time: lastKeyframe ? lastKeyframe.time + 100 : this.selectedNote.time,
          value: lastKeyframe ? lastKeyframe.value : 100,
          transitionType: 'linear'
        });
        this.selectedNote.size.sort((a, b) => a.time - b.time);
      }
    },
    removeNoteSizeKeyframe(index) {
      if (this.selectedNote && Array.isArray(this.selectedNote.size)) {
        if (this.selectedNote.size.length > 1) {
          this.selectedNote.size.splice(index, 1);
        } else {
          alert("A dynamic size must have at least one keyframe.");
        }
      }
    },
    handleUpdateEvent(updatedEvent) {
      if (!this.localChart) return;
      const event = this.localChart.events[updatedEvent.index];
      if (event) {
        event.time = updatedEvent.time;
        // The events array might need to be re-sorted if time changes significantly
        this.localChart.events.sort((a, b) => a.time - b.time);
      }
    },
    handleUpdateCameraEvent(updatedEvent) {
      if (!this.localChart || !this.localChart.cameraEvents) return;
      const event = this.localChart.cameraEvents[updatedEvent.index];
      if (event) {
        event.time = updatedEvent.time;
        this.localChart.cameraEvents.sort((a, b) => a.time - b.time);
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
.chart-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0d0d0d; /* Slightly darker */
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  background-color: #1a1a1a;
  border-bottom: 2px solid #00ffff;
  box-shadow: 0 5px 25px rgba(0, 255, 255, 0.2);
}

.audio-controls button {
  padding: 5px 10px;
}

.progress-bar {
  flex-grow: 1;
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  background: #444;
  outline: none;
  opacity: 0.7;
  transition: opacity .2s;
}

.progress-bar:hover {
  opacity: 1;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: #00ffff;
  cursor: pointer;
  border-radius: 50%;
}

.progress-bar::-moz-range-thumb {
  width: 15px;
  height: 15px;
  background: #00ffff;
  cursor: pointer;
  border-radius: 50%;
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
  background-color: #111; /* Darker header */
}

h1 {
  margin: 0;
  font-size: 24px;
  text-shadow: 0 0 10px #fff, 0 0 20px #ff00ff;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
}

button, .editor-toolbar select {
  padding: 8px 15px;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 0 10px #fff, 0 0 15px rgba(0, 255, 255, 0.5);
  transition: all 0.2s;
  font-family: sans-serif;
  font-size: 14px;
}

button:hover, .editor-toolbar select:hover {
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff;
  background-color: rgba(255, 255, 255, 0.2);
}

.export-button {
  border-color: #34c759;
  box-shadow: 0 0 10px #34c759, 0 0 15px rgba(52, 199, 89, 0.5);
}

.delete-button {
  border-color: #ff3b30;
  box-shadow: 0 0 10px #ff3b30, 0 0 15px rgba(255, 59, 48, 0.5);
}

button:disabled {
  border-color: #555;
  color: #777;
  box-shadow: none;
  cursor: not-allowed;
  background-color: rgba(30, 30, 30, 0.5);
}

.editor-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  background: #000;
}

.editor-sidebar {
  width: 250px;
  flex-shrink: 0;
  padding: 20px;
  background-color: #111;
  border-left: 2px solid #00ffff;
  box-shadow: -5px 0 25px rgba(0, 255, 255, 0.2);
  overflow-y: auto;
}

.editor-sidebar h3 {
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
  text-shadow: 0 0 8px #fff;
}

.sidebar-section {
  padding-top: 15px;
  margin-top: 15px;
  border-top: 1px solid #444;
}

.sidebar-section:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.property {
  margin-bottom: 15px;
}

.property label {
  display: block;
  font-size: 14px;
  margin-bottom: 5px;
  color: #aaa;
  text-shadow: none;
}

.property input {
  width: 100%;
  padding: 8px;
  background-color: #222;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.property input:focus {
  outline: none;
  border-color: #00ffff;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 255, 0.5);
}

.property input[type="range"] {
  width: 70%;
}
.property span {
  display: inline-block;
  width: 25%;
  text-align: right;
}

.timeline-container {
  position: relative; /* Needed for absolute positioning of playhead */
  border: 1px dashed #555;
  padding: 20px;
}

.playhead {
  position: absolute;
  left: 0;
  top: 0; /* The transform will handle the Y positioning */
  width: 100%;
  height: 3px;
  background-color: #fff;
  box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff;
  z-index: 50; /* Ensure it's above notes and events */
  pointer-events: none; /* Make sure it doesn't interfere with clicks */
}

.small-button {
  padding: 4px 8px;
  font-size: 12px;
  margin-top: 5px;
  width: 100%;
}

.keyframes-list {
  border: 1px solid #444;
  padding: 10px;
  border-radius: 5px;
  background-color: #222;
}

.keyframe-item {
  display: flex;
  justify-content: space-between;
  padding: 5px;
  border-bottom: 1px solid #333;
}
.keyframe-item:last-child {
  border-bottom: none;
}
</style>
