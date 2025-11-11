<template>
  <div :class="['note', noteType]"></div>
</template>

<script>
export default {
  name: 'GeometricNote',
  props: {
    noteType: {
      type: String,
      required: true,
      validator: value => ['tap', 'hold', 'swipe', 'catch'].includes(value)
    }
  }
};
</script>

<style scoped>
.note {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: transparent;
  border: 4px solid #fff;
  box-shadow: 0 0 15px #fff, 0 0 25px #ff00ff, inset 0 0 10px #fff;
}
.tap {
  /* Default shape */
}
.hold {
  /* Back to a static representation for now */
  height: 160px;
}
.swipe {
  transform: rotate(45deg);
}
.catch {
  width: 120px;
  height: 4px;
  border: none;
  background-color: #fff;
  box-shadow: 0 0 15px #fff, 0 0 25px #00ffff;
}
</style>
