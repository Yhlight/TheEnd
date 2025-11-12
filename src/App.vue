<template>
  <div id="app">
    <SongSelection v-if="currentView === 'songSelection'" @chartSelected="handleChartSelected" />
    <GameScreen
      v-if="currentView === 'game'"
      :chartUrl="selectedChartUrl"
      @exit="handleExit"
      @songFinished="handleSongFinished"
    />
    <ResultsScreen v-if="currentView === 'results'" :results="gameResults" @exit="handleExit" />
  </div>
</template>

<script>
import GameScreen from './components/GameScreen.vue';
import SongSelection from './views/SongSelection.vue';
import ResultsScreen from './views/ResultsScreen.vue';

export default {
  name: 'App',
  components: {
    GameScreen,
    SongSelection,
    ResultsScreen,
  },
  data() {
    return {
      currentView: 'songSelection',
      selectedChartUrl: '',
      gameResults: null,
    };
  },
  methods: {
    handleChartSelected(chartUrl) {
      this.selectedChartUrl = chartUrl;
      this.gameResults = null; // Reset previous results
      this.currentView = 'game';
    },
    handleSongFinished(results) {
      this.gameResults = results;
      this.currentView = 'results';
    },
    handleExit() {
      this.currentView = 'songSelection';
      this.selectedChartUrl = '';
      this.gameResults = null;
    }
  },
};
</script>

<style>
/* Resetting default styles for a cleaner base */
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
