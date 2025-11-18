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
    return {
      currentView: 'songSelection',
      selectedChartUrl: '', // This will now primarily be for the editor
      selectedChartData: null, // This will be the main way to pass data to the game
      gameResults: null,
      settings: {
        volume: 80,
        noteSpeed: 7,
        backgroundBrightness: 40,
        audioOffset: 0,
        noteSize: 100, // Default size
      },
      // Remove chartCache as GameStage will handle loading internally
    };
  },
  methods: {
    async handleChartSelected(chartUrl) {
      try {
        const response = await fetch(chartUrl);
        const chartData = await response.json();
        // Add a unique ID to the chart data if it doesn't have one
        if (!chartData.id) {
          chartData.id = chartUrl;
        }
        this.selectedChartData = chartData;
        this.selectedChartUrl = chartUrl; // Keep for retry logic
        this.gameResults = null;
        this.currentView = 'game';
      } catch (error) {
        console.error("Failed to load and parse chart:", error);
        // Handle error, e.g., show a message to the user
      }
    },
    async handleChartEditSelected(chartUrl) {
      // Logic for editor remains similar
      try {
        const response = await fetch(chartUrl);
        this.selectedChartData = await response.json();
        this.selectedChartUrl = chartUrl;
        this.currentView = 'editor';
      } catch (error) {
        console.error("Failed to load chart for editor:", error);
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
