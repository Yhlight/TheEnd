<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvas = ref(null)

onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.fillRect(10, 10, 150, 100)
})
</script>

<style scoped>
canvas {
  display: block;
}
</style>
