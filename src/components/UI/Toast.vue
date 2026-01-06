<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'warning' // warning, error, success
  },
  duration: {
    type: Number,
    default: 3000
  }
});

const emit = defineEmits(['close']);

let timer = null;

onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      emit('close');
    }, props.duration);
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <div class="toast-container" :class="type">
    <div class="toast-icon" v-if="type === 'warning'">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    </div>
    <div class="toast-icon" v-else-if="type === 'error'">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
    </div>
    <span class="toast-message">{{ message }}</span>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 50px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: slideDown 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  font-size: 14px;
  font-weight: 500;
  pointer-events: none; /* Allow clicking through if needed, but usually toasts are informational */
}

.toast-container.warning {
  background: rgba(255, 165, 0, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toast-container.error {
  background: rgba(220, 53, 69, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toast-container.success {
  background: rgba(40, 167, 69, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
