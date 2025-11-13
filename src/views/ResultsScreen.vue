<template>
  <div class="results-screen-overlay">
    <div class="results-menu">
      <h1>Results</h1>
      <div class="results-content">
        <div class="result-item">
          <span class="label">Score</span>
          <span class="value">{{ results.score }}</span>
        </div>
        <div class="result-item">
          <span class="label">Max Combo</span>
          <span class="value">{{ results.maxCombo }}</span>
        </div>
      </div>
      <div class="button-container">
        <button @click="$emit('retry')">Retry</button>
        <button @click="$emit('exit')">Back to Menu</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultsScreen',
  props: {
    results: {
      type: Object,
      required: true,
      validator: (value) => {
        return typeof value.score === 'number' && typeof value.maxCombo === 'number';
      },
    },
  },
  emits: ['exit', 'retry'],
};
</script>

<style scoped>
.results-screen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 300;
  color: #fff;
}

.results-menu {
  width: 80%;
  max-width: 500px;
  padding: 40px;
  background: rgba(10, 10, 10, 0.95);
  border: 2px solid #fff;
  border-radius: 10px;
  box-shadow: 0 0 25px #fff, 0 0 50px #ff00ff;
  text-align: center;
}

h1 {
  margin-top: 0;
  text-shadow: 0 0 10px #fff, 0 0 20px #ff00ff;
  font-size: 36px;
}

.results-content {
  margin: 40px 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 24px;
  margin-bottom: 20px;
}

.result-item .label {
  opacity: 0.8;
}

.result-item .value {
  font-weight: bold;
  font-size: 28px;
  text-shadow: 0 0 10px #fff;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

button {
  padding: 10px 20px;
  font-size: 18px;
  background: rgba(0,0,0,0.4);
  color: white;
  border: 2px solid white;
  border-radius: 5px;
  cursor: pointer;
  box-shadow: 0 0 10px #fff;
  transition: box-shadow 0.2s, background-color 0.2s;
}

button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff;
}
</style>
