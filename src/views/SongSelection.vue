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
      <h1>Select a Song</h1>
      <div class="actions-bar">
        <label for="import-chart-input" class="import-button">Import Chart</label>
        <input id="import-chart-input" type="file" @change="handleChartImport" accept=".json" style="display: none;">
      </div>
      <ul class="song-list" v-if="charts.length > 0">
        <li
          v-for="chart in charts"
          :key="chart.id"
          class="song-item"
        >
        <div class="song-info" @click="selectChart(chart)">
          <div class="song-title">{{ chart.title }}</div>
          <div class="song-artist">{{ chart.artist }}</div>
        </div>
        <button class="edit-button" @click="editChart(chart)">Edit</button>
        <button v-if="chart.isCustom" class="delete-button" @click.stop="deleteCustomChart(chart.id)">Delete</button>
        </li>
      </ul>
      <div v-else>
        <p>Loading charts...</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SongSelection',
  emits: ['chartSelected', 'chartEditSelected'],
  data() {
    return {
      charts: [],
      crystals: [],
      numCrystals: 20,
    };
  },
  async mounted() {
    this.loadCharts();
    this.generateCrystals();
  },
  methods: {
    async loadCharts() {
      try {
        // Load default charts
        const response = await fetch('/charts/index.json');
        const defaultCharts = await response.json();

        // Load custom charts from localStorage
        const customCharts = JSON.parse(localStorage.getItem('customCharts') || '[]');

        // Combine them, ensuring no ID collisions if that's a concern
        this.charts = [...defaultCharts, ...customCharts];

      } catch (error) {
        console.error("Failed to load chart index:", error);
        // Fallback to only custom charts if index fetch fails
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
    selectChart(chart) {
      if (chart.isCustom) {
        this.$emit('chartSelected', null, chart);
      } else {
        this.$emit('chartSelected', chart.url);
      }
    },
    editChart(chart) {
      if (chart.isCustom) {
        this.$emit('chartEditSelected', null, chart);
      } else {
        this.$emit('chartEditSelected', chart.url);
      }
    },
    handleChartImport(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const chartData = JSON.parse(e.target.result);

          // Basic validation
          if (!chartData.title || !chartData.artist || !chartData.notes) {
            alert('Invalid chart file. Missing required properties.');
            return;
          }

          const customCharts = JSON.parse(localStorage.getItem('customCharts') || '[]');

          // Use a unique ID for the custom chart
          const newChartId = `custom_${Date.now()}`;
          chartData.id = newChartId;
          chartData.isCustom = true;

          customCharts.push(chartData);
          localStorage.setItem('customCharts', JSON.stringify(customCharts));

          // Reload charts to display the new one
          this.loadCharts();

        } catch (error) {
          console.error("Error parsing imported chart:", error);
          alert('Failed to parse the chart file. Please ensure it is a valid JSON file.');
        }
      };
      reader.readAsText(file);

      // Reset file input to allow importing the same file again
      event.target.value = '';
    },
    deleteCustomChart(chartId) {
      if (window.confirm('Are you sure you want to delete this custom chart? This action cannot be undone.')) {
        let customCharts = JSON.parse(localStorage.getItem('customCharts') || '[]');
        customCharts = customCharts.filter(chart => chart.id !== chartId);
        localStorage.setItem('customCharts', JSON.stringify(customCharts));
        this.loadCharts(); // Refresh the list
      }
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
    transform: translate(0, 0) rotate(45deg) scale(1);
    opacity: 0;
  }
  25% {
    opacity: 0.8;
  }
  50% {
    transform: translate(40px, 80px) rotate(90deg) scale(1.2);
    opacity: 0.4;
  }
  75% {
      transform: translate(-20px, -30px) rotate(30deg) scale(0.8);
      opacity: 0.6;
  }
  100% {
    transform: translate(0, 0) rotate(45deg) scale(1);
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
  text-align: center;
}

h1 {
  text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff;
  margin-bottom: 20px;
  font-size: 3rem;
  letter-spacing: 2px;
}

.actions-bar {
  margin-bottom: 20px;
}

.import-button {
  display: inline-block;
  padding: 10px 20px;
  background: transparent;
  border: 2px solid #e0e0e0;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.import-button:hover {
  border-color: #ff00ff;
  color: #ff00ff;
  box-shadow: 0 0 10px #ff00ff;
}

.song-list {
  list-style: none;
  padding: 0;
  width: 80%;
  max-width: 700px; /* Increased max-width for a bolder look */
}

.song-item {
  display: flex;
  align-items: stretch; /* Stretch children to fill height */
  margin-bottom: 15px;
  border: 2px solid #00ffff;
  background-color: rgba(13, 13, 13, 0.8);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
  transition: box-shadow 0.2s ease-in-out;
  backdrop-filter: blur(5px);
}

.song-item:hover {
  box-shadow: 0 0 25px #00ffff, 0 0 40px #ff00ff;
}

.song-info {
  flex-grow: 1;
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.song-info:hover {
  background-color: rgba(0, 255, 255, 0.1);
}

.edit-button, .delete-button {
  padding: 0 20px;
  background: transparent;
  border: none;
  border-left: 2px solid #00ffff;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1em;
}

.edit-button:hover {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.5);
}

.delete-button {
  border-left: 2px solid #ff3b30;
}

.delete-button:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  box-shadow: inset 0 0 10px rgba(255, 59, 48, 0.5);
}

.song-title {
  font-size: 24px;
  font-weight: bold;
}

.song-artist {
  font-size: 16px;
  opacity: 0.8;
  margin-top: 5px;
}
</style>
