<template>
  <div class="hud">
    <button class="pause-button" @click="$emit('pause')">❚❚</button>
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
  },
  emits: ['pause'],
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
  align-items: center;
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
.score {
  order: 3; /* Push to the right */
}
.combo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
}
.score span:first-child, .combo span:first-child {
  font-size: 18px;
  opacity: 0.8;
}

.pause-button {
  order: 1; /* Keep on the left */
  background: rgba(0,0,0,0.4);
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 0 10px #fff;
}
</style>
