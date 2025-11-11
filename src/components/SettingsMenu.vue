<template>
  <div class="settings-overlay">
    <div class="settings-menu">
      <h2>Settings</h2>
      <div class="settings-content">
        <div class="setting-item">
          <label for="volume">Master Volume</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="100"
            v-model="volume"
            @input="onVolumeChange"
          />
          <span>{{ volume }}%</span>
        </div>
      </div>
      <button @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsMenu',
  emits: ['close', 'volumeChange'],
  data() {
    return {
      volume: 100, // Default volume
    };
  },
  methods: {
    onVolumeChange(event) {
      // Emit the volume change event with the value (0-100)
      this.$emit('volumeChange', parseInt(event.target.value));
    }
  }
};
</script>

<style scoped>
/* Base styles are unchanged */
.settings-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}
.settings-menu {
  width: 80%;
  max-width: 500px;
  padding: 30px;
  background: rgba(10, 10, 10, 0.95);
  border: 2px solid #fff;
  border-radius: 10px;
  box-shadow: 0 0 25px #fff, 0 0 50px #00ffff;
  color: #fff;
  text-align: center;
}
h2 {
  margin-top: 0;
  text-shadow: 0 0 10px #00ffff;
}
.settings-content {
  margin: 30px 0;
}
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.setting-item label {
  font-size: 18px;
}
input[type="range"] {
  width: 60%;
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
