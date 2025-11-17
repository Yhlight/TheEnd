<template>
  <GameCanvas />
</template>

<script>
import GameCanvas from './components/GameCanvas.vue';

export default {
  name: 'App',
  components: {
    GameCanvas,
  },
};
</script>

<style>
body {
  margin: 0;
  overflow: hidden; /* Prevent scrollbars */
}
</style>
