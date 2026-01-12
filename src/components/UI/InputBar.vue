<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  hasStarted: Boolean, // To trigger move to bottom
});

const emit = defineEmits(["submit"]);
const inputValue = ref("");
const inputRef = ref(null);

const { tm } = useI18n();

// Dynamic placeholder functionality
const getPlaceholderTexts = () => tm("ui.placeholders") || [];

const currentPlaceholder = ref(getPlaceholderTexts()[0] || "");
let placeholderInterval = null;
let currentIndex = 0;

// Check if dynamic placeholder is enabled
const isDynamicPlaceholderEnabled = () => {
  const setting = localStorage.getItem("use_dynamic_placeholder");
  return setting === null ? true : setting === "true"; // Default to true
};

// Start placeholder rotation
const startPlaceholderRotation = () => {
  const texts = getPlaceholderTexts();
  if (texts.length === 0) return;

  if (!isDynamicPlaceholderEnabled()) {
    currentPlaceholder.value = texts[0];
    return;
  }

  // Clear existing to avoid multiple intervals
  if (placeholderInterval) clearInterval(placeholderInterval);

  placeholderInterval = setInterval(() => {
    const currentTexts = getPlaceholderTexts(); // Re-fetch in case locale changed
    if (!isDynamicPlaceholderEnabled()) {
      clearInterval(placeholderInterval);
      currentPlaceholder.value = currentTexts[0];
      return;
    }

    currentIndex = (currentIndex + 1) % currentTexts.length;
    currentPlaceholder.value = currentTexts[currentIndex];
  }, 3500); // Change every 3.5 seconds
};

const handleSubmit = () => {
  if (!inputValue.value.trim()) return;
  emit("submit", inputValue.value.trim());
  inputValue.value = "";
};

const { locale } = useI18n(); // Destructure locale for watching

watch(locale, () => {
  // When locale changes, reset placeholder immediately to valid one from new language
  const texts = getPlaceholderTexts();
  if (texts.length > 0) {
    currentPlaceholder.value = texts[0];
  }
  startPlaceholderRotation();
});

onMounted(() => {
  startPlaceholderRotation();
});

onUnmounted(() => {
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
  }
});

const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
};

defineExpose({
  focus,
});
</script>

<template>
  <div class="input-container" :class="{ 'at-bottom': hasStarted }">
    <div class="input-wrapper glass">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="currentPlaceholder"
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
  position: relative;
  overflow: hidden;
}

/* Rainbow border effect */
.input-wrapper::before {
  content: "";
  position: absolute;
  inset: 0px;
  border-radius: 9999px;
  padding: 2px;
  background: linear-gradient(
    90deg,
    #ff0080,
    #ff8c00,
    #ffd700,
    #00ff00,
    #00bfff,
    #8a2be2,
    #ff0080
  );
  background-size: 200% 100%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  animation: rainbow-flow 3s linear infinite;
  pointer-events: none;
  z-index: -1;
}

@keyframes rainbow-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
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
