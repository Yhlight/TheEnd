<template>
  <div id="app">
    <SongSelection
      v-if="currentView === 'songSelection'"
      @chartSelected="handleChartSelected"
      @chartEditSelected="handleChartEditSelected"
    />
    <GameStage
      v-if="currentView === 'game'"
      :chartData="selectedChartData"
      :settings="settings"
      @exit="handleExit"
      @songFinished="handleSongFinished"
      @settingsChange="updateSettings"
    />
    <ResultsScreen
      v-if="currentView === 'results'"
      :results="gameResults"
      @exit="handleExit"
      @retry="handleRetry"
    />
    <ChartEditor
      v-if="currentView === 'editor'"
      :chartUrl="selectedChartUrl"
      :chartData="selectedChartData"
      @exit="handleExit"
    />
  </div>
</template>

<script>
// Keep SongSelection, ResultsScreen, ChartEditor as they are.
import SongSelection from './views/SongSelection.vue';
import ResultsScreen from './views/ResultsScreen.vue';
import ChartEditor from './views/ChartEditor.vue';

// Import the new GameStage component
import GameStage from './components/GameStage.vue';

export default {
  name: 'App',
  components: {
    SongSelection,
    ResultsScreen,
    ChartEditor,
    GameStage, // Register the new component
  },
  data() {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('gameSettings');
    const defaultSettings = {
      volume: 80,
      noteSpeed: 7,
      backgroundBrightness: 40,
      audioOffset: 0,
      noteSize: 100,
    };

    return {
      currentView: 'songSelection',
      selectedChartUrl: '',
      selectedChartData: null,
      gameResults: null,
      settings: savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings,
    };
  },
  methods: {
    async handleChartSelected(chartUrl, chartData = null) {
      if (chartData) {
        // Handle custom chart passed as an object
        this.selectedChartData = chartData;
        this.selectedChartUrl = chartData.id; // Use ID for potential retry
        this.gameResults = null;
        this.currentView = 'game';
      } else if (chartUrl) {
        // Handle default chart passed as a URL
        try {
          const response = await fetch(chartUrl);
          const loadedChartData = await response.json();
          if (!loadedChartData.id) {
            loadedChartData.id = chartUrl;
          }
          this.selectedChartData = loadedChartData;
          this.selectedChartUrl = chartUrl;
          this.gameResults = null;
          this.currentView = 'game';
        } catch (error) {
          console.error("Failed to load and parse chart:", error);
        }
      }
    },
    async handleChartEditSelected(chartUrl, chartData = null) {
      if (chartData) {
        this.selectedChartData = chartData;
        this.selectedChartUrl = chartData.id;
        this.currentView = 'editor';
      } else if (chartUrl) {
        try {
          const response = await fetch(chartUrl);
          this.selectedChartData = await response.json();
          this.selectedChartUrl = chartUrl;
          this.currentView = 'editor';
        } catch (error) {
          console.error("Failed to load chart for editor:", error);
        }
      }
    },
    handleSongFinished(results) {
      this.gameResults = results;
      this.currentView = 'results';
    },
    handleRetry() {
      // Retrying is now simpler, just re-select the same chart url
      this.handleChartSelected(this.selectedChartUrl);
    },
    handleExit() {
      this.currentView = 'songSelection';
      this.selectedChartUrl = '';
      this.selectedChartData = null;
      this.gameResults = null;
    },
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      // Save settings to localStorage whenever they are updated
      localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    },
  },
};
</script>

<style>
/* Global styles remain unchanged */
html, body {
  margin: 0;
  padding: 0;
  background-color: #000;
  color: #eee;
  font-family: sans-serif;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
