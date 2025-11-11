<template>
  <GameScreen />
</template>

<script>
import GameScreen from './components/GameScreen.vue';

export default {
  name: 'App',
  components: {
    GameScreen
  }
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
