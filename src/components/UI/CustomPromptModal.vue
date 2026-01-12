<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
  initialPrompt: String,
});

const emit = defineEmits(["close", "save"]);

const prompt = ref("");

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      prompt.value = props.initialPrompt || "";
    }
  }
);

const handleSave = () => {
  emit("save", prompt.value);
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay">
      <div class="modal glass" @click.stop>
        <h3>{{ $t("modal.customPrompt.title") }}</h3>

        <div class="field">
          <div class="input-wrapper glass-inset">
            <textarea
              v-model="prompt"
              rows="4"
              :placeholder="$t('modal.customPrompt.placeholder')"
            ></textarea>
          </div>
        </div>

        <div class="actions">
          <button class="btn cancel" @click="$emit('close')">
            {{ $t("modal.customPrompt.cancel") }}
          </button>
          <button class="btn confirm" @click="handleSave">
            {{ $t("modal.customPrompt.save") }}
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
  width: 420px;
  padding: 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  color: var(--color-text);
}

h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  text-align: center;
}

.field {
  margin-bottom: 24px;
}

.input-wrapper {
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  background: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(255, 255, 0, 0.2);
}

textarea {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--color-text);
  font-family: inherit;
  resize: none;
}

.hint {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  margin-bottom: 0;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
  background: transparent;
  color: var(--color-secondary-text);
}

.btn.cancel:hover {
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
