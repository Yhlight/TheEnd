<template>
  <div id="app">
    <GameScreen v-if="!gameFinished" @game-ended="showResults" />
    <ResultsScreen v-else :score="finalScore" :combo="finalCombo" @restart="restartGame" />
  </div>
</template>

<script>
import GameScreen from './components/GameScreen.vue';
import ResultsScreen from './components/ResultsScreen.vue';

export default {
  name: 'App',
  components: {
    GameScreen,
    ResultsScreen
  },
  data() {
    return {
      gameFinished: false,
      finalScore: 0,
      finalCombo: 0
    };
  },
  methods: {
    showResults(results) {
      this.finalScore = results.score;
      this.finalCombo = results.combo;
      this.gameFinished = true;
    },
    restartGame() {
      this.gameFinished = false;
      this.finalScore = 0;
      this.finalCombo = 0;
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
