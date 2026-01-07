<script setup>
import { ref } from "vue";

const props = defineProps({
  hasStarted: Boolean, // To trigger move to bottom
});

const emit = defineEmits(["submit"]);
const inputValue = ref("");

const handleSubmit = () => {
  if (!inputValue.value.trim()) return;
  emit("submit", inputValue.value.trim());
  inputValue.value = "";
};
</script>

<template>
  <div class="input-container" :class="{ 'at-bottom': hasStarted }">
    <div class="input-wrapper glass">
      <input
        v-model="inputValue"
        type="text"
        placeholder="头脑风暴一下..."
        @keyup.enter="handleSubmit"
        class="input-field"
      />
      <button @click="handleSubmit" class="send-btn">
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
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -15%);
  transition: all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none; /* Let clicks pass through area around input */
}

.input-container.at-bottom {
  top: 90%;
}

.input-wrapper {
  pointer-events: auto;
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 9999px;
  width: 400px;
  max-width: 90%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
  color: var(--color-text);
  font-family: inherit;
  padding: 8px;
}

.send-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #333;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover {
  color: var(--color-text);
}
</style>
