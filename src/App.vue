<template>
  <div id="app">
    <SongSelection v-if="currentView === 'songSelection'" @chartSelected="handleChartSelected" />
    <GameScreen v-if="currentView === 'game'" :chartUrl="selectedChartUrl" @exit="handleExit" />
  </div>
</template>

<script>
import GameScreen from './components/GameScreen.vue';
import SongSelection from './views/SongSelection.vue'; // Will create this component next

export default {
  name: 'App',
  components: {
    GameScreen,
    SongSelection,
  },
  data() {
    return {
      currentView: 'songSelection', // Start with the song selection screen
      selectedChartUrl: '',
    };
  },
  methods: {
    handleChartSelected(chartUrl) {
      this.selectedChartUrl = chartUrl;
      this.currentView = 'game';
    },
    handleExit() {
      this.currentView = 'songSelection';
      this.selectedChartUrl = '';
    }
  },
};
</script>

<style>
/* Resetting default styles for a cleaner base */
html, body {
  margin: 0;
  padding: 0;
  background-color: #000; /* Using black for the 'dark' theme */
  color: #eee;
  font-family: sans-serif;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Prevent scrollbars */
}

#app {
  width: 100%;
  height: 100%;
}
</style>
