<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  hasStarted: Boolean, // To trigger move to bottom
  associationMode: {
    type: String,
    default: "related",
  },
  isSearchEnabled: {
    type: Boolean,
    default: false,
  },
  hasSerperKey: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "submit",
  "update:associationMode",
  "update:isSearchEnabled",
  "request-custom-prompt",
  "request-document-upload",
]);
const inputValue = ref("");
const inputRef = ref(null);

const { tm, locale } = useI18n();

// Dynamic placeholder functionality
const getPlaceholderTexts = () => tm("ui.placeholders") || [];

const currentPlaceholder = ref(getPlaceholderTexts()[0] || "");
let placeholderInterval = null;
let currentIndex = 0;

// Association Modes
const selectedMode = ref(props.associationMode);
const showModeMenu = ref(false);
// const hasSerperKey = ref(false); // Removed internal ref

const modes = computed(() => {
  const allModes = [
    { value: "related", label: tm("modes.related") },
    { value: "tree", label: tm("modes.tree") },
    { value: "creative", label: tm("modes.creative") },
    { value: "deep", label: tm("modes.deep") },
    { value: "learning", label: tm("modes.learning") },
    { value: "document", label: tm("modes.document") },
    { value: "custom", label: tm("modes.custom") },
  ];
  return allModes;
});

const currentModeLabel = computed(() => {
  const mode = modes.value.find((m) => m.value === selectedMode.value);
  return mode ? mode.label : "";
});

watch(
  () => props.associationMode,
  (newVal) => {
    selectedMode.value = newVal;
  }
);

const toggleSearch = () => {
  emit("update:isSearchEnabled", !props.isSearchEnabled);
};

const toggleModeMenu = () => {
  showModeMenu.value = !showModeMenu.value;
};

const selectMode = (modeValue) => {
  selectedMode.value = modeValue;
  showModeMenu.value = false;

  emit("update:associationMode", selectedMode.value);

  if (selectedMode.value === "custom") {
    emit("request-custom-prompt");
  }
  if (selectedMode.value === "document") {
    emit("request-document-upload");
  }
};

// Close menu when clicking outside
const modeSelectorRef = ref(null);
const handleClickOutside = (event) => {
  if (modeSelectorRef.value && !modeSelectorRef.value.contains(event.target)) {
    showModeMenu.value = false;
  }
};

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

watch(locale, () => {
  // When locale changes, reset placeholder immediately to valid one from new language
  const texts = getPlaceholderTexts();
  if (texts.length > 0) {
    currentPlaceholder.value = texts[0];
  }
  startPlaceholderRotation();
});

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  startPlaceholderRotation();
  // Check key on mount (e.g. if loaded for first time and key exists)
  // const key = localStorage.getItem("serper_api_key");
  // hasSerperKey.value = !!key && key.trim().length > 0;
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
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
      <!-- Mode Selector Icon (Only visible if not started) -->
      <div
        v-if="!hasStarted"
        class="mode-selector-wrapper"
        ref="modeSelectorRef"
      >
        <button
          class="mode-btn"
          @click="toggleModeMenu"
          :title="currentModeLabel"
        >
          <!-- Default Grid Icon -->
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
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
        </button>
        <!-- Dropdown Menu -->
        <Transition name="fade">
          <div v-if="showModeMenu" class="mode-menu glass">
            <div
              v-for="mode in modes"
              :key="mode.value"
              class="mode-item"
              :class="{ active: selectedMode === mode.value }"
              @click="selectMode(mode.value)"
            >
              {{ mode.label }}
            </div>
          </div>
        </Transition>
      </div>

      <!-- Search Toggle (Visible if Key exists) -->
      <div
        v-if="hasSerperKey"
        class="search-toggle-wrapper"
        style="margin-right: 8px"
      >
        <button
          class="mode-btn"
          :class="{ 'active-search': isSearchEnabled }"
          @click="toggleSearch"
          :title="tm('modes.search')"
        >
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
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            ></path>
          </svg>
        </button>
      </div>

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
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
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
  width: 420px;
  max-width: 90%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  position: relative;
  /* overflow: hidden; Removed to allow visible dropdown */
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

/* Mode Selector Styles */
.mode-selector-wrapper {
  position: relative;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.mode-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-primary);
}

.mode-btn.active-search {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.mode-menu {
  position: absolute;
  bottom: 140%; /* Opens upwards */
  left: 0;
  width: 160px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px 0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 200;
  transform-origin: bottom left;
}

.mode-item {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.mode-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mode-item.active {
  font-weight: 800;
  text-decoration: underline;
  background: rgba(var(--color-primary-rgb), 0.1);
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
  margin-left: 4px;
}

.send-btn:hover {
  color: var(--color-text);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
