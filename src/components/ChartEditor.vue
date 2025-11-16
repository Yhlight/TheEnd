<template>
  <div class="chart-editor">
    <header class="editor-header">
      <h1>Editing: {{ songData.title }}</h1>
      <div class="controls">
        <button @click="togglePlayback">{{ isPlaying ? 'Pause' : 'Play' }}</button>
        <span>Time: {{ currentTime.toFixed(2) }}s</span>
      </div>
      <div>
        <button @click="exportChart" class="export-button">Export Chart</button>
        <button @click="emit('exit')" class="exit-button">Exit Editor</button>
      </div>
    </header>
    <div class="editor-body">
      <main class="editor-main">
        <canvas ref="timelineCanvas"></canvas>
      </main>
      <aside class="sidebar">
        <div class="tool-palette">
            <h2>Tools</h2>
            <button v-for="noteType in Object.keys(NOTE_TYPE_COLORS)"
                    :key="noteType"
                    :class="{ active: currentTool === noteType }"
                    @click="currentTool = noteType">
                {{ noteType }}
            </button>
            <button :class="{ active: currentTool === null }" @click="currentTool = null">Select</button>
        </div>
        <h2>Properties</h2>
        <div v-if="selectedNote" class="property-inspector">
            <label>Type: <strong>{{ selectedNote.type }}</strong></label>
            <label>Time (ms): <input type="number" v-model.number="selectedNote.time"></label>
            <label>Position X: <input type="number" step="0.01" v-model.number="selectedNote.x"></label>
            <label v-if="selectedNote.hasOwnProperty('duration')">Duration (ms): <input type="number" v-model.number="selectedNote.duration"></label>
        </div>
        <div v-else>
            <p>Select a note to see its properties.</p>
        </div>
        <hr>
        <div class="line-event-editor">
            <h2>Line Events</h2>
            <div class="event-list">
                <div v-for="(event, index) in songData.chart.lineEvents"
                     :key="index"
                     class="event-item"
                     @click="selectedLineEvent = event">
                    <span>@{{ event.time }}ms</span>
                    <button @click.stop="removeLineEvent(index)">X</button>
                </div>
            </div>
            <button @click="addNewLineEvent">Add New Event</button>
            <div v-if="selectedLineEvent" class="property-inspector">
                <label>Time (ms): <input type="number" v-model.number="selectedLineEvent.time"></label>
                <label>Duration (ms): <input type="number" v-model.number="selectedLineEvent.duration"></label>
                <label>Easing: <input type="text" v-model="selectedLineEvent.easing"></label>
                <fieldset>
                    <legend>Values</legend>
                    <label>Y Offset: <input type="number" v-model.number="selectedLineEvent.value.y"></label>
                    <label>Rotation: <input type="number" v-model.number="selectedLineEvent.value.rotation"></label>
                    <label>Alpha: <input type="number" step="0.1" v-model.number="selectedLineEvent.value.alpha"></label>
                    <label>Color: <input type="text" v-model="selectedLineEvent.value.color"></label>
                    <label>Glow: <input type="number" v-model.number="selectedLineEvent.value.glow"></label>
                </fieldset>
            </div>
        </div>
      </aside>
    </div>
    <audio ref="audioElement" :src="songData.audioUrl" @timeupdate="updateCurrentTime"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue';

const props = defineProps({
  songData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['exit']);

const timelineCanvas = ref(null);
const audioElement = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const selectedNote = ref(null);
const currentTool = ref(null); // 'tap', 'hold', etc. or null for selection
const selectedLineEvent = ref(null);

let ctx = null;
let animationFrameId = null;

// --- Timeline State ---
const viewState = {
  pixelsPerSecond: 100, // Zoom level
  scrollOffsetSeconds: 0, // Pan position
};

const NOTE_TYPE_COLORS = {
  tap: '#3498db',
  hold: '#2ecc71',
  flick: '#e74c3c',
  drag: '#f1c40f',
  catch: '#9b59b6',
};

onMounted(() => {
  ctx = timelineCanvas.value.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  timelineCanvas.value.addEventListener('mousedown', handleMouseDown);
  timelineCanvas.value.addEventListener('mousemove', handleMouseMove);
  timelineCanvas.value.addEventListener('mouseup', handleMouseUp);
  timelineCanvas.value.addEventListener('wheel', handleWheel);
  window.addEventListener('keydown', handleKeyDown);

  if (audioElement.value) {
    audioElement.value.load();
  }

  animationFrameId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
  window.removeEventListener('keydown', handleKeyDown);
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});

const resizeCanvas = () => {
  if (timelineCanvas.value) {
    timelineCanvas.value.width = timelineCanvas.value.parentElement.clientWidth;
    timelineCanvas.value.height = timelineCanvas.value.parentElement.clientHeight;
  }
};

const togglePlayback = () => {
  if (audioElement.value) {
    if (isPlaying.value) {
      audioElement.value.pause();
    } else {
      audioElement.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
};

const updateCurrentTime = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
  }
};

const timeToPx = (time) => {
  return (time - viewState.scrollOffsetSeconds) * viewState.pixelsPerSecond;
};

const pxToTime = (px) => {
  return px / viewState.pixelsPerSecond + viewState.scrollOffsetSeconds;
};


// --- Interaction Handlers ---
const interactionState = {
  isPanning: false,
  isDraggingNote: false,
  draggedNote: null,
  lastMouseX: 0,
  lastMouseY: 0,
};

const handleMouseDown = (e) => {
  if (e.altKey) {
    interactionState.isPanning = true;
    interactionState.lastMouseX = e.clientX;
    return;
  }

  const rect = timelineCanvas.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  let clickedNote = null;
  for (let i = props.songData.chart.notes.length - 1; i >= 0; i--) {
      const note = props.songData.chart.notes[i];
      const noteX = timeToPx(note.time / 1000);
      const noteY = note.x * timelineCanvas.value.height;
      const noteWidth = 10;
      const noteHeight = 20;

      if (mouseX >= noteX - noteWidth / 2 && mouseX <= noteX + noteWidth / 2 &&
          mouseY >= noteY - noteHeight / 2 && mouseY <= noteY + noteHeight / 2) {
          clickedNote = note;
          break;
      }
  }

  selectedNote.value = clickedNote;

  if (clickedNote) {
    interactionState.isDraggingNote = true;
    interactionState.draggedNote = clickedNote;
    interactionState.lastMouseX = e.clientX;
    interactionState.lastMouseY = e.clientY;
  } else if (currentTool.value) {
    // Add a new note if no note was clicked and a tool is active
    const newNote = {
      type: currentTool.value,
      time: Math.round(pxToTime(mouseX) * 1000), // Convert to ms
      x: Math.max(0, Math.min(1, mouseY / timelineCanvas.value.height)),
    };
    if (newNote.type === 'hold') {
      newNote.duration = 500; // Default duration
    }
    props.songData.chart.notes.push(newNote);
    // Sort notes by time to maintain order
    props.songData.chart.notes.sort((a, b) => a.time - b.time);
    selectedNote.value = newNote; // Auto-select the new note
  }
};

const handleMouseMove = (e) => {
  if (interactionState.isPanning) {
    const dx = e.clientX - interactionState.lastMouseX;
    viewState.scrollOffsetSeconds -= dx / viewState.pixelsPerSecond;
    interactionState.lastMouseX = e.clientX;
  } else if (interactionState.isDraggingNote) {
    const dx = e.clientX - interactionState.lastMouseX;
    const dy = e.clientY - interactionState.lastMouseY;

    const deltaTime = dx / viewState.pixelsPerSecond * 1000; // Convert pixel delta to ms
    const deltaX = dy / timelineCanvas.value.height;

    interactionState.draggedNote.time += deltaTime;
    interactionState.draggedNote.x += deltaX;

    // Clamp values
    interactionState.draggedNote.time = Math.max(0, interactionState.draggedNote.time);
    interactionState.draggedNote.x = Math.max(0, Math.min(1, interactionState.draggedNote.x));

    interactionState.lastMouseX = e.clientX;
    interactionState.lastMouseY = e.clientY;
  }
};

const handleMouseUp = (e) => {
  interactionState.isPanning = false;
  interactionState.isDraggingNote = false;
  interactionState.draggedNote = null;
};

const handleKeyDown = (e) => {
  if (e.key === 'Delete' && selectedNote.value) {
    const index = props.songData.chart.notes.indexOf(selectedNote.value);
    if (index > -1) {
      props.songData.chart.notes.splice(index, 1);
      selectedNote.value = null;
    }
  }
};

const addNewLineEvent = () => {
    const newEvent = {
        time: Math.round(currentTime.value * 1000),
        duration: 500,
        value: { y: 0, rotation: 0, alpha: 1, color: '#FFFFFF', glow: 10 },
        easing: 'linear',
    };
    props.songData.chart.lineEvents.push(newEvent);
    props.songData.chart.lineEvents.sort((a, b) => a.time - b.time);
    selectedLineEvent.value = newEvent;
};

const removeLineEvent = (index) => {
    props.songData.chart.lineEvents.splice(index, 1);
    if (selectedLineEvent.value === props.songData.chart.lineEvents[index]) {
        selectedLineEvent.value = null;
    }
};

const handleWheel = (e) => {
  e.preventDefault();
  const rect = timelineCanvas.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const timeAtMouse = pxToTime(mouseX);

  const zoomFactor = 1.1;
  if (e.deltaY < 0) {
    // Zoom in
    viewState.pixelsPerSecond *= zoomFactor;
  } else {
    // Zoom out
    viewState.pixelsPerSecond /= zoomFactor;
  }

  // Adjust scroll offset to keep the time at the mouse position constant
  viewState.scrollOffsetSeconds = timeAtMouse - mouseX / viewState.pixelsPerSecond;
};

const exportChart = () => {
  const chartJson = JSON.stringify(props.songData.chart, null, 2);
  const blob = new Blob([chartJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.songData.title.replace(' ', '_')}_chart.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


const draw = () => {
  if (!ctx) return;
  animationFrameId = requestAnimationFrame(draw);

  const width = timelineCanvas.value.width;
  const height = timelineCanvas.value.height;

  // Clear canvas
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(0, 0, width, height);

  // --- Draw Grid ---
  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 1;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#a0aec0';

  const startSeconds = Math.floor(viewState.scrollOffsetSeconds);
  const endSeconds = startSeconds + width / viewState.pixelsPerSecond;

  for (let s = startSeconds; s < endSeconds; s++) {
    const x = timeToPx(s);

    // Major second lines
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillText(`${s}s`, x + 5, 15);

    // Sub-second lines (e.g., quarter notes)
    ctx.globalAlpha = 0.3;
    for (let i = 1; i < 4; i++) {
        const subX = timeToPx(s + i * 0.25);
        ctx.beginPath();
        ctx.moveTo(subX, 0);
        ctx.lineTo(subX, height);
        ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;


  // --- Draw Notes ---
  if (props.songData && props.songData.chart) {
    props.songData.chart.notes.forEach(note => {
      // On the timeline, the X-axis represents TIME.
      const x = timeToPx(note.time / 1000);
      // The Y-axis represents the note's horizontal position (its 'x' property in the game).
      const y = note.x * height;
      const noteWidth = 10;
      const noteHeight = 20;

      ctx.fillStyle = NOTE_TYPE_COLORS[note.type] || '#bdc3c7';
      ctx.fillRect(x - noteWidth / 2, y - noteHeight / 2, noteWidth, noteHeight);

      if (selectedNote.value === note) {
        ctx.strokeStyle = '#FFD700'; // Gold color for selection
        ctx.lineWidth = 2;
        ctx.strokeRect(x - noteWidth / 2 - 1, y - noteHeight / 2 - 1, noteWidth + 2, noteHeight + 2);
      }

      if (note.type === 'hold') {
        const durationPx = (note.duration / 1000) * viewState.pixelsPerSecond;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x - noteWidth / 2, y - noteHeight / 2, durationPx, noteHeight);
        ctx.globalAlpha = 1.0;
      }
    });

    // --- Draw Line Events ---
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    props.songData.chart.lineEvents.forEach(event => {
        const x = timeToPx(event.time / 1000);
        ctx.beginPath();
        ctx.moveTo(x, height - 15);
        ctx.lineTo(x - 5, height);
        ctx.lineTo(x + 5, height);
        ctx.closePath();
        ctx.fill();
    });
  }

  // --- Draw Playhead ---
  const playheadX = timeToPx(currentTime.value);
  ctx.strokeStyle = '#e53e3e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
};

</script>

<style scoped>
.chart-editor {
  width: 100vw;
  height: 100vh;
  background-color: #1a202c;
  z-index: 100;
  color: white;
  display: flex;
  flex-direction: column;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #2d3748;
  border-bottom: 2px solid #4a5568;
  flex-shrink: 0;
}
.editor-header h1 {
  margin: 0;
  font-size: 1.5em;
}
.exit-button {
  background-color: #e53e3e;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
}
.exit-button:hover {
  background-color: #c53030;
}
.export-button {
  background-color: #3182ce;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}
.export-button:hover {
    background-color: #2b6cb0;
}
.editor-body {
  display: flex;
  flex-grow: 1;
  overflow: hidden; /* Prevent canvas from overflowing */
}
.editor-main {
  flex-grow: 1;
  position: relative;
}
.editor-main canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.sidebar {
  width: 250px;
  background-color: #1a202c;
  padding: 15px;
  border-left: 2px solid #4a5568;
  flex-shrink: 0;
  overflow-y: auto;
}
.tool-palette {
  margin-bottom: 20px;
  border-bottom: 1px solid #4a5568;
  padding-bottom: 15px;
}
.tool-palette button {
  width: calc(50% - 5px);
  margin: 2.5px;
  padding: 8px;
  background-color: #4a5568;
  color: white;
  border: 1px solid #a0aec0;
  cursor: pointer;
  transition: background-color 0.2s;
}
.tool-palette button:hover {
  background-color: #718096;
}
.tool-palette button.active {
  background-color: #3182ce;
  border-color: #63b3ed;
}
.property-inspector label {
  display: block;
  margin-bottom: 10px;
}
.property-inspector input {
  width: 100%;
  padding: 5px;
  background-color: #4a5568;
  border: 1px solid #a0aec0;
  color: white;
  border-radius: 3px;
}
.line-event-editor .event-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #4a5568;
  margin-bottom: 10px;
}
.line-event-editor .event-item {
  display: flex;
  justify-content: space-between;
  padding: 5px;
  cursor: pointer;
}
.line-event-editor .event-item:hover {
  background-color: #4a5568;
}
.line-event-editor .event-item button {
  background-color: #c53030;
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
}
</style>
