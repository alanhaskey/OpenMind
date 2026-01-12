<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close", "save"]);
const provider = ref("gemini");
const geminiKey = ref("");
const deepseekKey = ref("");
const kimiKey = ref("");
const qwenKey = ref("");
const localBaseUrl = ref("http://localhost:11434/v1");
const localModelName = ref("qwen2.5");
const localApiKey = ref("");
const maxSelectionCount = ref(null); // Changed default to null
const generateCount = ref(6);

// Reload settings from localStorage whenever modal opens
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      provider.value = localStorage.getItem("llm_provider") || "gemini";
      geminiKey.value = localStorage.getItem("gemini_api_key") || "";
      deepseekKey.value = localStorage.getItem("deepseek_api_key") || "";
      kimiKey.value = localStorage.getItem("kimi_api_key") || "";
      qwenKey.value = localStorage.getItem("qwen_api_key") || "";
      localBaseUrl.value =
        localStorage.getItem("local_base_url") || "http://localhost:11434/v1";
      localModelName.value =
        localStorage.getItem("local_model_name") || "qwen2.5";
      localApiKey.value = localStorage.getItem("local_api_key") || "";

      const storedLimit = localStorage.getItem("max_selection_count");
      maxSelectionCount.value = storedLimit ? parseInt(storedLimit) : null;

      generateCount.value = parseInt(
        localStorage.getItem("generate_count") || 6
      );
    }
  }
);

const handleSave = () => {
  localStorage.setItem("llm_provider", provider.value);
  localStorage.setItem("gemini_api_key", geminiKey.value.trim());
  localStorage.setItem("deepseek_api_key", deepseekKey.value.trim());
  localStorage.setItem("kimi_api_key", kimiKey.value.trim());
  localStorage.setItem("qwen_api_key", qwenKey.value.trim());
  localStorage.setItem("local_base_url", localBaseUrl.value.trim());
  localStorage.setItem("local_model_name", localModelName.value.trim());
  localStorage.setItem("local_api_key", localApiKey.value.trim());

  if (maxSelectionCount.value) {
    localStorage.setItem("max_selection_count", maxSelectionCount.value);
  } else {
    localStorage.removeItem("max_selection_count"); // Clear if empty
  }

  localStorage.setItem("generate_count", generateCount.value);
  emit("save");
  emit("close");
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay">
      <div class="modal glass" @click.stop>
        <h3>{{ $t("modal.settings.title") }}</h3>

        <div class="field">
          <label>{{ $t("modal.settings.maxNodes") }}</label>
          <div class="input-wrapper glass-inset">
            <input
              v-model.number="maxSelectionCount"
              type="number"
              min="1"
              :placeholder="$t('modal.settings.maxNodesPlaceholder')"
            />
          </div>
        </div>

        <div class="field">
          <label>{{ $t("modal.settings.maxGen") }}</label>
          <div class="input-wrapper glass-inset">
            <input
              v-model.number="generateCount"
              type="number"
              min="1"
              max="10"
              :placeholder="$t('modal.settings.maxGenPlaceholder')"
            />
          </div>
        </div>

        <div class="field">
          <label>{{ $t("modal.settings.provider") }}</label>
          <div class="input-wrapper glass-inset">
            <select v-model="provider">
              <option value="gemini">
                {{ $t("modal.settings.providerGemini") }}
              </option>
              <option value="deepseek">
                {{ $t("modal.settings.providerDeepSeek") }}
              </option>
              <option value="kimi">
                {{ $t("modal.settings.providerKimi") }}
              </option>
              <option value="qwen">
                {{ $t("modal.settings.providerQwen") }}
              </option>
              <option value="local">
                {{ $t("modal.settings.providerLocal") }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="provider === 'gemini'" class="field">
          <label>{{ $t("modal.settings.apiKey") }}</label>
          <div class="input-wrapper glass-inset">
            <input
              v-model="geminiKey"
              type="password"
              :placeholder="$t('modal.settings.apiPlaceholder')"
            />
          </div>
          <p class="hint">{{ $t("modal.settings.hintGemini") }}</p>
        </div>

        <div v-if="provider === 'deepseek'" class="field">
          <label>{{ $t("modal.settings.deepseekKey") }}</label>
          <div class="input-wrapper glass-inset">
            <input
              v-model="deepseekKey"
              type="password"
              placeholder="输入 DeepSeek key..."
            />
          </div>
          <p class="hint">{{ $t("modal.settings.hintDeepSeek") }}</p>
        </div>

        <div v-if="provider === 'kimi'" class="field">
          <label>{{ $t("modal.settings.kimiKey") }}</label>
          <div class="input-wrapper glass-inset">
            <input
              v-model="kimiKey"
              type="password"
              placeholder="输入 Moonshot key..."
            />
          </div>
          <p class="hint">{{ $t("modal.settings.hintKimi") }}</p>
        </div>

        <div v-if="provider === 'qwen'" class="field">
          <label>{{ $t("modal.settings.qwenKey") }}</label>
          <div class="input-wrapper glass-inset">
            <input
              v-model="qwenKey"
              type="password"
              placeholder="输入 DashesScope key..."
            />
          </div>
          <p class="hint">{{ $t("modal.settings.hintQwen") }}</p>
        </div>

        <div v-if="provider === 'local'" class="local-fields">
          <div class="field">
            <label>{{ $t("modal.settings.apiUrl") }}</label>
            <div class="input-wrapper glass-inset">
              <input
                v-model="localBaseUrl"
                type="text"
                :placeholder="$t('modal.settings.placeholderUrl')"
              />
            </div>
          </div>
          <div class="field">
            <label>{{ $t("modal.settings.modelName") }}</label>
            <div class="input-wrapper glass-inset">
              <input
                v-model="localModelName"
                type="text"
                :placeholder="$t('modal.settings.placeholderModel')"
              />
            </div>
          </div>
          <div class="field">
            <label>{{ $t("modal.settings.localKey") }}</label>
            <div class="input-wrapper glass-inset">
              <input
                v-model="localApiKey"
                type="password"
                :placeholder="$t('modal.settings.placeholderOptional')"
              />
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn cancel" @click="$emit('close')">
            {{ $t("modal.edit.cancel") }}
          </button>
          <button class="btn confirm" @click="handleSave">
            {{ $t("modal.settings.save") }}
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
  width: 360px;
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

label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  color: var(--color-secondary-text);
}

.input-wrapper {
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  transition: all 0.2s;
  display: flex; /* Ensure select fills */
}

.input-wrapper:focus-within {
  background: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(255, 255, 0, 0.2);
}

input,
select {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--color-text);
  font-family: inherit;
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
