<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close"]);

const defaultColor = "#ffff00";
const presetColor = "#009dff"; // Neon Blue/Cyan
const currentColor = ref(defaultColor);

// Read from storage on mount
onMounted(() => {
  const stored = localStorage.getItem("theme_color");
  if (stored) {
    currentColor.value = stored;
  }
});

// Watch for show to refresh current color in case it changed elsewhere (unlikely but good practice)
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      const stored = localStorage.getItem("theme_color");
      if (stored) {
        currentColor.value = stored;
      } else {
        currentColor.value = defaultColor;
      }
    }
  }
);

const applyColor = (color) => {
  currentColor.value = color;
  document.documentElement.style.setProperty("--color-primary", color);
  localStorage.setItem("theme_color", color);
};

const handleColorInput = (e) => {
  applyColor(e.target.value);
};

const resetToDefault = () => {
  applyColor(defaultColor);
};

const usePreset = () => {
  applyColor(presetColor);
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="$emit('close')">
      <div class="modal glass" @click.stop>
        <h3>{{ $t("modal.theme.title") || "Theme Color" }}</h3>

        <div class="color-picker-container">
          <input
            type="color"
            :value="currentColor"
            @input="handleColorInput"
            class="color-input"
          />
          <span class="color-preview">{{ currentColor }}</span>
        </div>

        <div class="presets">
          <button
            class="btn preset-btn"
            @click="resetToDefault"
            :title="$t('modal.theme.reset') || 'Reset to Default'"
          >
            <div
              class="color-circle"
              :style="{ background: defaultColor }"
            ></div>
            <span>{{ $t("modal.theme.default") || "Default" }}</span>
          </button>
          <button
            class="btn preset-btn"
            @click="usePreset"
            :title="$t('modal.theme.preset') || 'Backup Preset'"
          >
            <div
              class="color-circle"
              :style="{ background: presetColor }"
            ></div>
            <span>{{ $t("modal.theme.backup") || "Preset" }}</span>
          </button>
        </div>

        <div class="actions">
          <button class="btn confirm" @click="$emit('close')">
            {{ $t("modal.theme.save") || "Done" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  width: 320px;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: var(--color-text);
}

.color-picker-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.color-input {
  width: 80px;
  height: 80px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}

.color-preview {
  font-family: monospace;
  color: var(--color-secondary-text);
}

.presets {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.preset-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.color-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.actions {
  display: flex;
  justify-content: center;
}

.btn.confirm {
  background: var(--color-primary);
  color: black;
  padding: 8px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.btn.confirm:hover {
  filter: brightness(0.95);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
