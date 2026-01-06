<script setup>
defineProps({
  show: Boolean,
  title: String,
  message: String,
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="$emit('cancel')">
      <div class="modal glass" @click.stop>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="actions">
          <button class="btn cancel" @click="$emit('cancel')">Cancel</button>
          <button class="btn confirm" @click="$emit('confirm')">Confirm</button>
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
  width: 300px;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: var(--color-text);
}

p {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--color-secondary-text);
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

.btn.cancel:hover {
  background: rgba(0, 0, 0, 0.1);
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
