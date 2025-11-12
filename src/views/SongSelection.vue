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
        const response = await fetch('/charts/index.json');
        this.charts = await response.json();
      } catch (error) {
        console.error("Failed to load chart index:", error);
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
      this.$emit('chartSelected', chart.url);
    },
    editChart(chart) {
      this.$emit('chartEditSelected', chart.url);
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

h1 {
  text-shadow: 0 0 10px #fff, 0 0 20px #00ffff;
  margin-bottom: 40px;
}

.song-list {
  list-style: none;
  padding: 0;
  width: 80%;
  max-width: 600px;
}

.song-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  border: 2px solid #fff;
  border-radius: 10px;
  background-color: rgba(20, 20, 20, 0.8);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

.song-item:hover {
  box-shadow: 0 0 25px #fff, 0 0 40px #00ffff;
}

.song-info {
  flex-grow: 1;
  padding: 20px;
  cursor: pointer;
  border-radius: 8px 0 0 8px;
}

.song-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.edit-button {
  padding: 0 20px;
  height: 100%;
  align-self: stretch;
  background: rgba(0, 255, 255, 0.1);
  color: white;
  border: none;
  border-left: 2px solid #fff;
  border-radius: 0 8px 8px 0;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-button:hover {
  background-color: rgba(0, 255, 255, 0.3);
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
