<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  hiddenRootIds: {
    type: Set,
    required: true,
  },
});

const emit = defineEmits(["toggle-visibility", "new-sheet"]);
const { t } = useI18n();

const rootNodes = computed(() => {
  return props.nodes.filter((n) => n.isCenter);
});

const isVisible = (node) => {
  return !props.hiddenRootIds.has(node.rootId);
};
</script>

<template>
  <div class="sheet-bar">
    <TransitionGroup
      name="sheet-insert"
      tag="div"
      class="sheets-container"
      appear
    >
      <div
        v-for="node in rootNodes"
        :key="node.id"
        class="sheet-tab"
        :class="{ 'is-hidden': !isVisible(node) }"
        @click="emit('toggle-visibility', node.rootId)"
        :title="node.text"
      >
        <span class="status-indicator"></span>
        <span class="sheet-text">{{ node.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.sheet-bar {
  position: absolute;
  top: 70px;
  left: 20px;
  z-index: 10;
  pointer-events: none;
}

.sheets-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  pointer-events: auto;
  align-items: flex-start;
  max-height: 230px;
  overflow-y: auto;
  width: 140px;
  position: relative; /* Context for absolute transitions */
}

.sheet-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 0.9rem;
  color: var(--color-text);
  border: 1px solid transparent;
  width: 100%;
  box-sizing: border-box;
}

.sheet-tab:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(2px);
}

.sheet-tab.is-hidden {
  opacity: 0.5;
  background: rgba(0, 0, 0, 0.1);
}

.sheet-tab:not(.is-hidden) {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-primary);
  flex-shrink: 0;
}

.sheet-tab.is-hidden .status-indicator {
  background-color: #999;
}

.sheet-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

/* Scrollbar styling */
.sheets-container::-webkit-scrollbar {
  width: 4px;
}

.sheets-container::-webkit-scrollbar-track {
  background: transparent;
}

.sheets-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* Sheet Insert Animation: Left to Right */
.sheet-insert-enter-active,
.sheet-insert-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.sheet-insert-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.sheet-insert-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 
   Removed absolute positioning on leave to prevent "flying out" effect.
   The item will stay in flow until it disappears, then list collapses.
*/
</style>
