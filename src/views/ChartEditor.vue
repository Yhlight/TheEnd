<template>
  <div class="chart-editor">
    <div class="editor-header">
      <h1>Chart Editor</h1>
      <button @click="$emit('exit')">Back to Menu</button>
    </div>
    <div class="editor-content">
      <div v-if="chart" class="timeline-container">
        <EditorTimeline :chart="chart" />
      </div>
      <div v-else>
        <p>Loading chart data...</p>
      </div>
    </div>
  </div>
</template>

<script>
import EditorTimeline from '../components/EditorTimeline.vue';

export default {
  name: 'ChartEditor',
  components: { EditorTimeline },
  props: {
    chartUrl: { type: String, required: true },
    chartData: { type: Object, default: null },
  },
  emits: ['exit', 'chartLoaded'],
  data() {
    return {
      chart: null,
    };
  },
  mounted() {
    this.loadChart();
  },
  methods: {
    async loadChart() {
      try {
        let chartJson;
        if (this.chartData) {
          chartJson = this.chartData;
        } else {
          if (!this.chartUrl) return;
          const response = await fetch(this.chartUrl);
          chartJson = await response.json();
        }
        this.chart = chartJson;
        this.$emit('chartLoaded', { url: this.chartUrl, data: chartJson });
      } catch (error) {
        console.error("Failed to load chart for editor:", error);
      }
    },
  },
};
</script>

<style scoped>
.chart-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #111;
  color: #fff;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #222;
  border-bottom: 2px solid #00ffff;
}

h1 {
  margin: 0;
  font-size: 24px;
}

button {
  padding: 8px 15px;
  /* ... standard button styles */
}

.editor-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}

.timeline-container {
  /* Placeholder styles */
  border: 1px dashed #555;
  padding: 20px;
}
</style>
