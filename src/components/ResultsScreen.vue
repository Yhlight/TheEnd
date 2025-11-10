<template>
  <div class="results-screen">
    <h1>Results</h1>
    <div class="final-score">Score: {{ score }}</div>
    <div class="max-combo">Max Combo: {{ combo }}</div>
    <div class="restart-button" @click="$emit('restart')">Play Again</div>
  </div>
</template>

<script>
export default {
  name: 'ResultsScreen',
  props: ['score', 'combo']
};
</script>

<style scoped>
.results-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #1A1A2E;
  color: white;
  font-family: sans-serif;
}
.final-score, .max-combo {
  font-size: 30px;
  margin: 10px;
}
.restart-button {
  margin-top: 40px;
  padding: 15px 30px;
  background-color: #00FFFF;
  color: #1A1A2E;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 10px;
}
</style>
