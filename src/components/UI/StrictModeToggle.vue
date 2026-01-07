<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const toggle = () => {
  emit("update:modelValue", !modelValue);
};
</script>

<template>
  <div
    class="strict-mode-toggle glass"
    @click="$emit('update:modelValue', !modelValue)"
    :title="
      modelValue ? '主题限定模式：已开启 (L)' : '主题限定模式：已关闭 (L)'
    "
  >
    <div class="toggle-track" :class="{ active: modelValue }">
      <div class="toggle-thumb"></div>
    </div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  </div>
</template>

<style scoped>
.strict-mode-toggle {
  position: absolute;
  top: 30px;
  right: 30px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  z-index: 100;
  cursor: pointer;
  gap: 8px;
  transition: all 0.3s ease;
  user-select: none;
}

.strict-mode-toggle:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.toggle-track {
  width: 36px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  position: relative;
  transition: all 0.3s ease;
}

.toggle-track.active {
  background: var(--color-primary, #000);
}

.toggle-thumb {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-track.active .toggle-thumb {
  left: 18px;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
</style>
