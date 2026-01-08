<script setup>
defineProps({
  show: Boolean,
  canEdit: Boolean,
});

const emit = defineEmits(["delete", "edit"]);
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="node-actions glass">
      <button
        class="icon-btn delete-btn"
        @click="$emit('delete')"
        title="删除选中节点 (D)"
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
          <polyline points="3 6 5 6 21 6"></polyline>
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path>
        </svg>
      </button>

      <div class="divider"></div>

      <button
        class="icon-btn edit-btn"
        :disabled="!canEdit"
        @click="$emit('edit')"
        title="编辑最后选中节点 (E)"
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
          <path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          ></path>
          <path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          ></path>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.node-actions {
  position: absolute;
  bottom: 30px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 100;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-btn:hover:not(:disabled) {
  color: #ff4d4f; /* Red for delete */
  background: rgba(255, 77, 79, 0.1);
}

.edit-btn:hover:not(:disabled) {
  color: #1890ff; /* Blue for edit */
  background: rgba(24, 144, 255, 0.1);
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
