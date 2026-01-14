<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close", "complete"]);
const { t } = useI18n();

const currentStepIndex = ref(0);
const targetRect = ref(null);
const tooltipPosition = ref({ top: 0, left: 0 });
const arrowPosition = ref({ top: 0, left: 0 }); // Relative to tooltip

// Steps configuration
// targetIds should correspond to IDs or Classes in the DOM.
// We will use precise selector strings.
const steps = [
  {
    key: "input",
    target: "#input-bar-container",
  },
  {
    key: "topRight",
    target: "#top-right-controls",
  },
  {
    key: "bottomRight",
    target: "#control-panel-container",
  },
  {
    key: "topLeft",
    target: "#about-trigger",
  },
];

// If search key exists, we might want to insert search step.
// For simplicity, we can just check if element exists.

const currentStep = computed(() => steps[currentStepIndex.value]);

const isLastStep = computed(() => currentStepIndex.value === steps.length - 1);

const updatePosition = async () => {
  await nextTick();
  const step = currentStep.value;

  if (!step.target) {
    // Center position
    targetRect.value = null;
    return;
  }

  const el = document.querySelector(step.target);
  if (el) {
    const rect = el.getBoundingClientRect();
    targetRect.value = rect;

    // Calculate tooltip position
    // Default: Below the element
    const margin = 12;
    let top = rect.bottom + margin;
    let left = rect.left + rect.width / 2;

    // Boundary checks (basic)
    const tooltipWidth = 300; // Approx max width
    if (left - tooltipWidth / 2 < 10) {
      left = tooltipWidth / 2 + 10;
    } else if (left + tooltipWidth / 2 > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth / 2 - 10;
    }

    // If bottom overflow, put above
    if (top + 200 > window.innerHeight) {
      top = rect.top - margin - 200; // Rough height est
    }

    tooltipPosition.value = { top, left };
  } else {
    // Fallback to center if target not found
    targetRect.value = null;
  }
};

const next = () => {
  if (isLastStep.value) {
    emit("complete");
  } else {
    currentStepIndex.value++;
  }
};

const skip = () => {
  emit("close");
};

watch([() => props.show, currentStepIndex], () => {
  if (props.show) {
    updatePosition();
  }
});

onMounted(() => {
  window.addEventListener("resize", updatePosition);
});
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="tour-overlay" :class="{ dimmed: !targetRect }">
      <!-- Spotlight Effect (Optional, using simple overlay for now) -->

      <!-- Highlight Box -->
      <div
        v-if="targetRect"
        class="highlight-box"
        :style="{
          top: targetRect.top - 20 + 'px',
          left: targetRect.left - 20 + 'px',
          width: targetRect.width + 40 + 'px',
          height: targetRect.height + 40 + 'px',
        }"
      ></div>

      <!-- Tooltip / Bubble -->
      <div
        class="tour-bubble glass"
        :class="{ 'center-mode': !targetRect }"
        :style="
          targetRect
            ? {
                top: tooltipPosition.top + 'px',
                left: tooltipPosition.left + 'px',
              }
            : {}
        "
      >
        <div class="content">
          <h3>{{ t(`onboarding.${currentStep.key}.title`) }}</h3>
          <p>{{ t(`onboarding.${currentStep.key}.content`) }}</p>
        </div>

        <div class="footer">
          <span class="step-indicator">
            {{ currentStepIndex + 1 }} / {{ steps.length }}
          </span>
          <div class="buttons">
            <button class="btn text" @click="skip">
              {{ t("onboarding.actions.skip") }}
            </button>
            <button class="btn primary" @click="next">
              {{
                isLastStep
                  ? t("onboarding.actions.done")
                  : t("onboarding.actions.next")
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
  transition: background 0.3s ease;
  pointer-events: auto; /* Block interactions outside */
}

.tour-overlay.dimmed {
  background: rgba(0, 0, 0, 0.5);
}

/* Hole punch effect or Highlight Box */
.highlight-box {
  position: absolute;
  border-radius: 8px;
  /* Massive shadow acts as the overlay */
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  border: 2px solid var(--color-primary);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* Smoother easing */
  pointer-events: none;
  z-index: 10000;
  background: transparent;
}

.tour-bubble {
  position: absolute;
  width: 320px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%); /* Center horizontally relative to left pos */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10001; /* Above highlight */
}

.tour-bubble.center-mode {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--color-text);
}

p {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--color-secondary-text);
  line-height: 1.5;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-indicator {
  font-size: 12px;
  color: var(--color-secondary-text);
  font-weight: 500;
}

.buttons {
  display: flex;
  gap: 12px;
}

.btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn.text {
  color: var(--color-secondary-text);
}

.btn.text:hover {
  color: var(--color-text);
}

.btn.primary {
  background: var(--color-primary);
  color: black;
}

.btn.primary:hover {
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
