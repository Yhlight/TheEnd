/**
 * The ChartManager is responsible for loading and parsing chart data.
 */
const chartManager = {
  /**
   * Loads a chart file from the public/charts directory.
   * @param {string} chartName - The name of the chart file (e.g., 'sample.json').
   * @returns {Promise<object>} A promise that resolves with the parsed chart data.
   * @throws {Error} If the chart fails to load or parse.
   */
  async loadChart(chartName) {
    const chartUrl = `/charts/${chartName}`;
    try {
      const response = await fetch(chartUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to load chart: ${chartName}`, error);
      throw error;
    }
  }
};

export default chartManager;
