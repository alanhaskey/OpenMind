<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "中文",
  },
});

const emit = defineEmits(["update:modelValue"]);

const languages = [
  { value: "中文", label: "中文" },
  { value: "English", label: "English" },
  { value: "日本語", label: "日本語" },
  { value: "Español", label: "Español" },
  { value: "Français", label: "Français" },
  { value: "Deutsch", label: "Deutsch" },
  { value: "한국어", label: "한국어" },
];

const showDropdown = ref(false);

const selectLanguage = (lang) => {
  emit("update:modelValue", lang.value);
  localStorage.setItem("selected_language", lang.value);
  showDropdown.value = false;
};

const currentLanguage = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    currentLanguage.value = newVal;
  }
);
</script>

<template>
  <div class="language-selector glass">
    <button
      class="selector-btn"
      @click="showDropdown = !showDropdown"
      :title="'当前语言: ' + modelValue"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
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
      <span class="label">{{ modelValue }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chevron"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <div v-if="showDropdown" class="dropdown">
      <div
        v-for="lang in languages"
        :key="lang.value"
        class="dropdown-item"
        :class="{ active: lang.value === modelValue }"
        @click="selectLanguage(lang)"
      >
        {{ lang.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-selector {
  position: absolute;
  top: 30px;
  right: 180px;
  border-radius: 20px;
  z-index: 100;
  user-select: none;
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}

.selector-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.label {
  min-width: 50px;
  text-align: left;
}

.chevron {
  transition: transform 0.3s ease;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 120px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
  color: var(--color-text);
}

.dropdown-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dropdown-item.active {
  background: var(--color-primary);
  color: black;
  font-weight: 600;
}
</style>
