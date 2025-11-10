<template>
  <div class="settings-overlay" @click.self="$emit('close')">
    <div class="settings-menu">
      <h2>Settings</h2>
      <div class="setting">
        <label for="volume">Volume</label>
        <input
          type="range"
          id="volume"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          @input="$emit('update:volume', parseFloat($event.target.value))"
        />
      </div>
      <div class="close-button" @click="$emit('close')">Close</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsMenu',
  props: ['volume'],
  emits: ['update:volume', 'close']
};
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.settings-menu {
  background-color: #1A1A2E;
  padding: 30px;
  border-radius: 10px;
  border: 2px solid #00FFFF;
  color: white;
  font-family: sans-serif;
  width: 80%;
  max-width: 400px;
}
.setting {
  margin: 20px 0;
}
.setting label {
  margin-right: 15px;
}
.close-button {
  margin-top: 30px;
  padding: 10px 20px;
  background-color: #00FFFF;
  color: #1A1A2E;
  text-align: center;
  cursor: pointer;
  border-radius: 5px;
}
</style>
