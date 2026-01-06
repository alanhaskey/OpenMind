<script setup>
import { computed } from "vue";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  isLoading: Boolean,
  showTranslation: {
    type: Boolean,
    default: true
  },
  isLastSelected: Boolean,
});

const emit = defineEmits(["click", "contextmenu"]);

const isSelected = computed(() => props.node.isSelected);
const isCenter = computed(() => props.node.isCenter);

const style = computed(() => ({
  transform: `translate(${props.node.x}px, ${props.node.y}px)`,
  width: isCenter.value ? "120px" : isSelected.value ? "100px" : "80px",
  height: isCenter.value ? "120px" : isSelected.value ? "100px" : "80px",
  zIndex: isSelected.value || isCenter.value ? 10 : 1,
}));

// Logic:
// If showEnglish is TRUE: Main = Text (Eng), Sub = Translation (CN)
// If showEnglish is FALSE: Main = Translation (CN) or Text (Fallback), Sub = Hidden
const mainText = computed(() => {
  if (props.showEnglish) return props.node.text;
  return props.node.translation || props.node.text;
});

const subText = computed(() => {
  if (props.showEnglish) return props.node.translation || "";
  return ""; // Hide subtitle if English is hidden (assume Chinese is main)
});
</script>

<template>
  <div
    class="node glass"
    :class="{ selected: isSelected, 'last-selected': isLastSelected, center: isCenter, loading: isLoading }"
    :style="style"
    @click.stop="emit('click', node)"
    @contextmenu.prevent="emit('contextmenu', node)"
  >
    <div class="content">
      <span class="text">{{ node.text }}</span>
      <span class="translation" v-if="showTranslation && node.translation">{{ node.translation }}</span>
    </div>
    <div v-if="isLoading" class="spinner"></div>
  </div>
</template>

<style scoped>
.node {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: transform, width, height;
  /* Centering the node on its coordinate */
  margin-left: -40px;
  margin-top: -40px;
  border: 1px solid var(--glass-border);
}

.node.center {
  background: rgba(255, 255, 0, 0.1); /* Subtle yellow tint */
  border-color: var(--color-primary);
  margin-left: -60px;
  margin-top: -60px;
}

.node.selected {
  border-color: var(--color-selection); /* Green */
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3), var(--glass-shadow);
  margin-left: -50px;
  margin-top: -50px;
}

/* User Req: Last selected is Blue */
.node.last-selected {
  border-color: #00BFFF; /* Deep Sky Blue */
  box-shadow: 0 0 25px rgba(0, 191, 255, 0.5), var(--glass-shadow);
  background: rgba(0, 191, 255, 0.05);
}

.spinner {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  pointer-events: none;
  /* Glowing rotating border effect */
  background: conic-gradient(from 0deg, transparent 0%, transparent 60%, #FFA500 100%);
  animation: rotate 1.5s linear infinite;
  /* Mask to create a border ring */
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.text {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
  word-break: break-word;
  color: var(--color-text);
}

.translation {
  font-size: 10px;
  color: var(--color-secondary-text);
  margin-top: 4px;
  line-height: 1.1;
}
</style>
