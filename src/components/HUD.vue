<template>
  <div class="hud">
    <div class="score">
      <span>Score</span>
      <span>{{ score }}</span>
    </div>
    <div class="combo">
      <span>Combo</span>
      <span>{{ combo }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HUD',
  props: {
    score: {
      type: Number,
      required: true
    },
    combo: {
      type: Number,
      required: true
    }
  }
};
</script>

<style scoped>
.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 24px;
  z-index: 50;
  text-shadow: 0 0 5px #fff, 0 0 10px #ff00ff;
}
.score, .combo {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.score span:first-child, .combo span:first-child {
  font-size: 18px;
  opacity: 0.8;
}
</style>
