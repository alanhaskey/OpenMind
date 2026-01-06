<template>
  <div class="logo" @click="$emit('click')">
    <span class="text">OpenMind</span>
  </div>
</template>

<style scoped>
.logo {
  position: absolute;
  top: 20px;
  left: 30px;
  z-index: 50;
  pointer-events: auto;
  cursor: pointer;
}

.text {
  font-family: "Inter", sans-serif;
  font-weight: 800;
  font-size: 24px;
  letter-spacing: -0.5px;
  color: var(--color-text);
}
</style>
