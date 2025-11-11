<template>
  <div class="song-selection-screen">
    <h1>Select a Song</h1>
    <ul class="song-list">
      <li
        v-for="chart in charts"
        :key="chart.id"
        class="song-item"
        @click="selectChart(chart)"
      >
        <div class="song-title">{{ chart.title }}</div>
        <div class="song-artist">{{ chart.artist }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'SongSelection',
  emits: ['chartSelected'],
  data() {
    return {
      // Hardcoded chart list for now
      charts: [
        {
          id: 'sample',
          title: 'Sample Song',
          artist: 'TheEnd Developer',
          url: '/charts/sample.json',
        },
        // More charts can be added here in the future
      ],
    };
  },
  methods: {
    selectChart(chart) {
      this.$emit('chartSelected', chart.url);
    },
  },
};
</script>

<style scoped>
.song-selection-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
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
  padding: 20px;
  margin-bottom: 15px;
  border: 2px solid #fff;
  border-radius: 10px;
  background-color: rgba(20, 20, 20, 0.8);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
}

.song-item:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px #fff, 0 0 40px #00ffff;
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
