<template>
  <div class="note-container">
    <div :class="['note', type, { shattered: isShattered }]" @animationend="resetShatter">
      <div class="particle" v-for="i in 4" :key="i"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GeometricNote',
  props: {
    type: {
      type: String,
      required: true,
      validator: function (value) {
        return ['tap', 'hold', 'swipe', 'catch'].indexOf(value) !== -1;
      },
    },
    shatter: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isShattered: false,
    };
  },
  watch: {
    shatter(newValue) {
      if (newValue) {
        this.isShattered = true;
      }
    },
  },
  methods: {
    resetShatter() {
      this.isShattered = false;
      this.$emit('animation-end');
    },
  },
};
</script>

<style scoped>
.note {
  width: 80px;
  height: 80px;
  background-color: var(--element-color);
  position: relative;
  transition: background-color 0.5s, box-shadow 0.5s;
  box-shadow: 0 0 15px 5px var(--glow-color);
  cursor: pointer;
}

/* Hide particles by default */
.particle {
  display: none;
  position: absolute;
  background-color: var(--element-color);
  width: 30px;
  height: 30px;
}

.note.shattered {
  animation: shatter-main 0.4s ease-out forwards;
}

.note.shattered .particle {
  display: block;
}

/* Shatter animations for particles */
.note.shattered .particle:nth-child(1) { animation: shatter-p1 0.4s ease-out forwards; }
.note.shattered .particle:nth-child(2) { animation: shatter-p2 0.4s ease-out forwards; }
.note.shattered .particle:nth-child(3) { animation: shatter-p3 0.4s ease-out forwards; }
.note.shattered .particle:nth-child(4) { animation: shatter-p4 0.4s ease-out forwards; }


.note.tap { /* Square */ }
.note.hold { height: 160px; }
.note.swipe { width: 70px; height: 70px; transform: rotate(45deg); }
.note.catch { width: 120px; height: 10px; border-radius: 5px; }


/* Keyframe Animations */
@keyframes shatter-main {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0; }
}

@keyframes shatter-p1 { /* Top-left */
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(-60px, -60px) rotate(-90deg); opacity: 0; }
}
@keyframes shatter-p2 { /* Top-right */
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(60px, -60px) rotate(90deg); opacity: 0; }
}
@keyframes shatter-p3 { /* Bottom-left */
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(-60px, 60px) rotate(90deg); opacity: 0; }
}
@keyframes shatter-p4 { /* Bottom-right */
  0% { transform: translate(60px, 60px) rotate(-90deg); opacity: 0; }
}
</style>
