<script setup>
defineProps({
  show: Boolean,
});

const emit = defineEmits(['close']);
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="$emit('close')">
      <div class="modal glass" @click.stop>
        <h3>关于 OpenMind</h3>
        
        <div class="info-section">
          <div class="row">
            <span class="label">开发者</span>
            <span class="value">Yunnn</span>
          </div>
          <div class="row">
            <span class="label">联系方式</span>
            <span class="value">alanhaskey2013@qq.com</span>
          </div>
          <div class="row">
            <span class="label">GitHub</span>
            <a class="value" href="https://github.com/alanhaskey/OpenMind">alanhaskey | OpenMind</a>
          </div>
          <div class="row">
            <span class="label">当前版本</span>
            <span class="value">v1.0.1</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn confirm" @click="$emit('close')">关闭</button>
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
  background: rgba(255, 255, 255, 0.95);
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: var(--color-text);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  text-align: left;
  background: rgba(0,0,0,0.02);
  padding: 16px;
  border-radius: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 13px;
  color: var(--color-secondary-text);
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  user-select: text; /* Allow copying email */
}

.actions {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 8px 30px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
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
