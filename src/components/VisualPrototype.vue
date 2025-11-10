<template>
  <div class="visual-prototype" :class="themeClass">
    <div class="controls">
      <button @click="toggleTheme">Toggle Theme</button>
    </div>
    <div class="note-display">
      <GeometricNote type="tap" />
      <GeometricNote type="hold" />
      <GeometricNote type="swipe" />
      <GeometricNote type="catch" />
    </div>
  </div>
</template>

<script>
import GeometricNote from './GeometricNote.vue';

export default {
  name: 'VisualPrototype',
  components: {
    GeometricNote,
  },
  data() {
    return {
      theme: 'pale', // 'pale' or 'dark'
    };
  },
  computed: {
    themeClass() {
      return `theme-${this.theme}`;
    },
  },
  methods: {
    toggleTheme() {
      this.theme = this.theme === 'pale' ? 'dark' : 'pale';
    },
  },
};
</script>

<style scoped>
/* Define CSS Variables for the themes */
.visual-prototype {
  --background-color: #EAEAEA;
  --element-color: #1A1A1A;
  --glow-color: rgba(255, 255, 255, 0.75);
  --border-color: #1A1A1A;
}

.visual-prototype.theme-dark {
  --background-color: #050505;
  --element-color: #00FFFF;
  --glow-color: rgba(0, 255, 255, 0.5);
  --border-color: #00FFFF;
}

.visual-prototype {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--background-color);
  color: var(--element-color);
  transition: background-color 0.5s, color 0.5s;
}

.note-display {
  display: flex;
  gap: 40px;
  align-items: center;
  padding: 40px;
  border: 2px solid var(--border-color);
  transition: border-color 0.5s;
}

.controls {
  position: absolute;
  top: 20px;
  left: 20px;
}

button {
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
  background-color: var(--element-color);
  color: var(--background-color);
  border: 1px solid var(--border-color);
  transition: background-color 0.5s, color 0.5s;
}
</style>
