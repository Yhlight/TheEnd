<template>
  <div class="song-selection-screen">
    <div class="crystals-bg">
      <div
        v-for="crystal in crystals"
        :key="crystal.id"
        class="crystal"
        :style="crystal.style"
      ></div>
    </div>
    <div class="content">
      <h1 class="title">Select a Song</h1>
      <div class="actions-bar">
        <button class="import-button" @click="handleChartImport">Import Chart</button>
      </div>

      <div class="song-atlas-container">
          <div class="song-atlas" ref="atlasRef" :style="atlasStyle">
              <div
                  v-for="(chart, index) in charts"
                  :key="chart.id"
                  class="song-card"
                  :style="getCardStyle(index)"
                  @click="handleCardClick(index)"
              >
                  <div class="song-cover-container">
                      <img
                          :src="chart.coverUrl"
                          alt="Chart Cover"
                          class="song-cover"
                          @error="handleImageError"
                      >
                  </div>
                  <div class="song-title">{{ chart.title }}</div>
                  <div class="song-artist">{{ chart.artist }}</div>
              </div>
          </div>
          <div class="selection-indicator"></div>
      </div>

      <div class="selected-song-actions">
          <button class="edit-button" @click="editSelectedChart">Edit</button>
          <button v-if="selectedChart && selectedChart.isCustom" class="delete-button" @click="deleteSelectedChart">Delete</button>
      </div>

      <div v-if="charts.length === 0">
        <p>Loading charts...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

const CARD_WIDTH = 300; // Includes margin
const LERP_FACTOR = 0.1;

export default {
  name: 'SongSelection',
  emits: ['chartSelected', 'chartEditSelected'],
  data() {
    return {
      charts: [],
      crystals: [],
      numCrystals: 20,
      selectedIndex: 0,
      scrollPosition: 0,
      targetScrollPosition: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartScroll: 0,
    };
  },
  computed: {
    atlasStyle() {
      return {
        transform: `translateX(${this.scrollPosition}px)`,
      };
    },
    selectedChart() {
        return this.charts[this.selectedIndex] || null;
    }
  },
  async mounted() {
    this.loadCharts();
    this.generateCrystals();
    this.addEventListeners();
    this.animationLoop();
  },
  beforeUnmount() {
      this.removeEventListeners();
  },
  methods: {
    // ... (loadCharts, generateCrystals, handleChartImport, processFileContent methods are unchanged)
    async loadCharts() {
      try {
        const response = await fetch('/charts/index.json');
        const defaultCharts = await response.json();
        const customCharts = JSON.parse(localStorage.getItem('customCharts') || '[]');
        this.charts = [...defaultCharts, ...customCharts];
      } catch (error) {
        console.error("Failed to load chart index:", error);
        this.charts = JSON.parse(localStorage.getItem('customCharts') || '[]');
      }
    },
    generateCrystals() {
      for (let i = 0; i < this.numCrystals; i++) {
        const size = 20 + Math.random() * 60;
        this.crystals.push({
          id: i,
          style: {
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${15 + Math.random() * 20}s`,
            animationDelay: `${Math.random() * 15}s`,
          }
        });
      }
    },

    // --- New Methods for Cover Flow ---
    addEventListeners() {
      const atlasEl = this.$refs.atlasRef;
      if (!atlasEl) return;
      atlasEl.addEventListener('mousedown', this.handleDragStart);
      window.addEventListener('mousemove', this.handleDragMove);
      window.addEventListener('mouseup', this.handleDragEnd);
      atlasEl.addEventListener('touchstart', this.handleDragStart, { passive: false });
      window.addEventListener('touchmove', this.handleDragMove, { passive: false });
      window.addEventListener('touchend', this.handleDragEnd);
    },
    removeEventListeners() {
        const atlasEl = this.$refs.atlasRef;
        if (!atlasEl) return;
        atlasEl.removeEventListener('mousedown', this.handleDragStart);
        window.removeEventListener('mousemove', this.handleDragMove);
        window.removeEventListener('mouseup', this.handleDragEnd);
        atlasEl.removeEventListener('touchstart', this.handleDragStart);
        window.removeEventListener('touchmove', this.handleDragMove);
        window.removeEventListener('touchend', this.handleDragEnd);
    },
    animationLoop() {
      this.scrollPosition += (this.targetScrollPosition - this.scrollPosition) * LERP_FACTOR;
      requestAnimationFrame(this.animationLoop);
    },
    handleDragStart(event) {
      this.isDragging = true;
      const touch = event.touches ? event.touches[0] : event;
      this.dragStartX = touch.clientX;
      this.dragStartScroll = this.scrollPosition;
      event.preventDefault();
    },
    handleDragMove(event) {
      if (!this.isDragging) return;
      const touch = event.touches ? event.touches[0] : event;
      const deltaX = touch.clientX - this.dragStartX;
      this.targetScrollPosition = this.dragStartScroll + deltaX;
    },
    handleDragEnd() {
      if (!this.isDragging) return;
      this.isDragging = false;

      // Snap to the nearest card
      const containerWidth = this.$el.clientWidth;
      // The target position for the left edge of the atlas, so the selected card is centered.
      const centerOffset = (containerWidth / 2) - (CARD_WIDTH / 2);

      const closestIndex = Math.round((centerOffset - this.targetScrollPosition) / CARD_WIDTH);
      this.selectedIndex = Math.max(0, Math.min(this.charts.length - 1, closestIndex));
      this.targetScrollPosition = centerOffset - (this.selectedIndex * CARD_WIDTH);
    },
    handleCardClick(index) {
        if (this.isDragging) return; // Prevent selection during drag
        const containerWidth = this.$el.clientWidth;
        const centerOffset = (containerWidth / 2) - (CARD_WIDTH / 2);

        if (this.selectedIndex === index) {
            // A tiny delay to prevent accidental double-clicks from registering weirdly
            setTimeout(() => {
                const chart = this.charts[index];
                if (chart.isCustom) {
                    this.$emit('chartSelected', null, chart);
                } else {
                    this.$emit('chartSelected', chart.url, null);
                }
            }, 50);
        } else {
            // Otherwise, just scroll to it
            this.selectedIndex = index;
            this.targetScrollPosition = centerOffset - (index * CARD_WIDTH);
        }
    },
    getCardStyle(index) {
      const distance = this.selectedIndex - index;
      const absDistance = Math.abs(distance);
      const scale = 1 - absDistance * 0.15;
      const opacity = 1 - absDistance * 0.3;
      return {
        transform: `scale(${scale})`,
        opacity: `${opacity}`,
        zIndex: this.charts.length - absDistance,
      };
    },
    editSelectedChart() {
        if (!this.selectedChart) return;
        const chart = this.selectedChart;
        if (chart.isCustom) {
            this.$emit('chartEditSelected', null, chart);
        } else {
            this.$emit('chartEditSelected', chart.url);
        }
    },
    deleteSelectedChart() {
        if (!this.selectedChart || !this.selectedChart.isCustom) return;
        if (window.confirm('Are you sure you want to delete this custom chart?')) {
            let customCharts = JSON.parse(localStorage.getItem('customCharts') || '[]');
            customCharts = customCharts.filter(c => c.id !== this.selectedChart.id);
            localStorage.setItem('customCharts', JSON.stringify(customCharts));
            this.loadCharts();
            // Reset selection after deletion
            this.selectedIndex = 0;
            const centerOffset = this.$el.clientWidth / 2 - CARD_WIDTH / 2;
            this.targetScrollPosition = -(this.selectedIndex * CARD_WIDTH) + centerOffset;
        }
    },
    // ... (handleChartImport and processFileContent are unchanged)
    async handleChartImport() {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await FilePicker.pickFiles({
            types: ['application/json'],
            readData: true,
          });
          const file = result.files[0];
          if (!file) return;
          const fileContent = atob(file.data);
          this.processFileContent(fileContent);
        } catch (error) {
          console.error("Error picking file on native:", error);
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => this.processFileContent(e.target.result);
          reader.readAsText(file);
        };
        input.click();
      }
    },
    processFileContent(content) {
      try {
        const chartData = JSON.parse(content);
        if (!chartData.title || !chartData.artist || !chartData.notes) {
          alert('Invalid chart file. Missing required properties.');
          return;
        }
        const customCharts = JSON.parse(localStorage.getItem('customCharts') || '[]');
        const newChartId = `custom_${Date.now()}`;
        chartData.id = newChartId;
        chartData.isCustom = true;
        customCharts.push(chartData);
        localStorage.setItem('customCharts', JSON.stringify(customCharts));
        this.loadCharts();
      } catch (error) {
        console.error("Error processing imported chart:", error);
        alert('Failed to parse the chart file. Please ensure it is a valid JSON file.');
      }
    },
    handleImageError(event) {
        event.target.style.display = 'none';
        event.target.parentElement.classList.add('placeholder-bg');
    },
  },
};
</script>

<style scoped>
.song-selection-screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  color: #fff;
}

.crystals-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.crystal {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3), 0 0 25px rgba(0, 255, 255, 0.2);
  transform: rotate(45deg);
  animation: float linear infinite;
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(45deg);
    opacity: 0;
  }
  25% {
    opacity: 0.7;
  }
  50% {
    transform: translate(20px, 40px) rotate(60deg);
    opacity: 0.5;
  }
  75% {
    opacity: 0.7;
  }
  100% {
    transform: translate(0, 0) rotate(45deg);
    opacity: 0;
  }
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.title {
  text-shadow: 0 0 10px #fff, 0 0 20px #00ffff;
  margin-bottom: 20px;
}

.actions-bar {
  margin-bottom: 20px;
}
.import-button {
    /* styles unchanged */
}

/* --- New Atlas/Cover Flow Styles --- */
.song-atlas-container {
    width: 100%;
    height: 350px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.song-atlas {
    display: flex;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
}
.song-card {
    width: 250px;
    height: 300px;
    margin: 0 25px;
    flex-shrink: 0;
    background: rgba(30, 30, 30, 0.7);
    border: 2px solid #fff;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}
.song-cover-container {
    width: 100%;
    height: 200px;
    background-color: #111; /* Fallback color */
}
.placeholder-bg {
    background: radial-gradient(circle, rgba(60,20,80,1) 0%, rgba(10,5,20,1) 100%);
}
.song-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.song-title {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    margin-top: 15px;
    text-align: center;
}
.song-artist {
    font-size: 14px;
    color: #ccc;
    margin-top: 5px;
}
.selection-indicator {
    position: absolute;
    width: 260px; /* Slightly larger than card */
    height: 310px;
    border: 3px solid #00ffff;
    border-radius: 12px;
    box-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff inset;
    pointer-events: none; /* Let clicks pass through */
    transition: all 0.3s ease-out;
}
.selected-song-actions {
    margin-top: 20px;
    display: flex;
    gap: 15px;
}
.edit-button, .delete-button {
    padding: 10px 20px;
    border: 1px solid #fff;
    border-radius: 5px;
    background: rgba(0,0,0,0.4);
    color: white;
    cursor: pointer;
    transition: all 0.2s;
}
.edit-button {
    border-color: #00ffff;
}
.edit-button:hover {
    background: rgba(0, 255, 255, 0.2);
    box-shadow: 0 0 15px #00ffff;
}
.delete-button {
    border-color: #ff3b30;
}
.delete-button:hover {
    background: rgba(255, 59, 48, 0.2);
    box-shadow: 0 0 15px #ff3b30;
}
</style>
