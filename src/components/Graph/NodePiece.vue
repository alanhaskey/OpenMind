<script setup>
import { computed } from "vue";

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  isLoading: Boolean,
  isLastSelected: Boolean,
  expanded: Boolean,
  isHighlighted: Boolean,
  isContext: Boolean,
});

const emit = defineEmits(["click", "contextmenu"]);

const isSelected = computed(() => props.node.isSelected);
const isCenter = computed(() => props.node.isCenter);
const expanded = computed(() => props.node.expanded);

const style = computed(() => ({
  "--x": `${props.node.x}px`,
  "--y": `${props.node.y}px`,
  width: isCenter.value ? "120px" : isSelected.value ? "100px" : "80px",
  height: isCenter.value ? "120px" : isSelected.value ? "100px" : "80px",
  zIndex: isSelected.value || isCenter.value ? 10 : 1,
}));
</script>

<template>
  <div
    class="node glass"
    :class="{
      selected: isSelected,
      'last-selected': isLastSelected,
      center: isCenter,
      loading: isLoading,
      expanded: expanded && !isCenter,
      'highlight-node': isHighlighted,
      'highlight-context': isContext,
    }"
    :style="style"
    @click.stop="emit('click', node)"
    @contextmenu.prevent="emit('contextmenu', node)"
  >
    <div class="content">
      <span class="text">{{ node.text }}</span>
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
  /* Use CSS variables for position so transitions can scale independently */
  /* Center the node using translate(-50%, -50%) to handle dynamic size changes automatically */
  transform: translate(var(--x), var(--y)) translate(-50%, -50%);
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
    height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.4s ease,
    border-color 0.4s ease, box-shadow 0.4s ease;
  will-change: transform, width, height;
  border: 1px solid var(--glass-border);
}

.node.center {
  background: color-mix(
    in srgb,
    var(--color-primary) 10%,
    transparent
  ); /* Dynamic tint */
  border-color: var(--color-primary);
}

.node.expanded {
  border-color: var(--color-primary);
}

.node.selected {
  border-color: var(--color-selection); /* Green */
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3), var(--glass-shadow);
}

/* User Req: Last selected is Blue */
.node.last-selected {
  border-color: #00bfff; /* Deep Sky Blue */
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
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    transparent 60%,
    color-mix(in srgb, var(--color-primary), black 25%) 100%
  );
  animation: rotate 1.5s linear infinite;
  /* Mask to create a border ring */
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 2px),
    black calc(100% - 2px)
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 2px),
    black calc(100% - 2px)
  );
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
</style>
