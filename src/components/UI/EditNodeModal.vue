<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  initialText: String,
});

const emit = defineEmits(['close', 'save']);

const inputValue = ref('');

watch(() => props.show, (newVal) => {
  if (newVal) {
    inputValue.value = props.initialText || '';
  }
});

const handleSave = () => {
  if (inputValue.value.trim()) {
    emit('save', inputValue.value.trim());
  }
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="$emit('close')">
      <div class="modal glass" @click.stop>
        <h3>编辑节点</h3>
        <div class="input-wrapper glass-inset">
          <input 
            v-model="inputValue" 
            type="text" 
            placeholder="输入新文本..."
            @keyup.enter="handleSave"
            ref="inputRef" 
            autofocus
          />
        </div>
        <div class="actions">
          <button class="btn cancel" @click="$emit('close')">取消</button>
          <button class="btn confirm" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Reuse styles nicely or duplicate minimal set for speed */
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
  z-index: 210; /* Higher than normal modal */
}

.modal {
  width: 320px;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: var(--color-text);
}

.input-wrapper {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 4px 12px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
}

input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 16px;
  color: var(--color-text);
  outline: none;
  text-align: center;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn.cancel {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.btn.confirm {
  background: var(--color-primary);
  color: black;
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
