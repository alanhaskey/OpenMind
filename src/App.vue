<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import GraphCanvas from "./components/Graph/GraphCanvas.vue";
import InputBar from "./components/UI/InputBar.vue";
import LogoPiece from "./components/UI/LogoPiece.vue";
import ControlPanel from "./components/UI/ControlPanel.vue";
import Modal from "./components/UI/Modal.vue";
import SettingsModal from "./components/UI/SettingsModal.vue";
import AboutModal from "./components/UI/AboutModal.vue";
import NodeActions from "./components/UI/NodeActions.vue";
import EditNodeModal from "./components/UI/EditNodeModal.vue";
import StrictModeToggle from "./components/UI/StrictModeToggle.vue";
import LanguageSelector from "./components/UI/LanguageSelector.vue";
import Toast from "./components/UI/Toast.vue";
import ThemeColorModal from "./components/UI/ThemeColorModal.vue";
import CustomPromptModal from "./components/UI/CustomPromptModal.vue";

import { getRelatedWords } from "./services/aiService";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const graphRef = ref(null);
const inputBarRef = ref(null);
const hasStarted = ref(false);
const showResetModal = ref(false);
const showSettingsModal = ref(false);
const showAboutModal = ref(false);
const showEditModal = ref(false);
const showThemeColorModal = ref(false);
const showCustomPromptModal = ref(false);

const strictMode = ref(false);

const associationMode = ref("related");
const customPrompt = ref("");
const documentContent = ref("");

// Toast State
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("warning");

const editingNodeId = ref(null);
const editingNodeText = ref("");

const showToastMessage = (msg, type = "warning") => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
};

const hasSelection = computed(() => {
  return (
    graphRef.value &&
    graphRef.value.selectedNodeIds &&
    graphRef.value.selectedNodeIds.length > 0
  );
});

const canEdit = computed(() => {
  return hasSelection.value;
});

const handleInputSubmit = async (text) => {
  if (!text) return;
  hasStarted.value = true;

  if (graphRef.value) {
    const newNode = graphRef.value.addNode(text, "");
    graphRef.value.clearSelection();

    if (newNode) {
      setTimeout(() => {
        graphRef.value.panToNode(newNode);
      }, 500);
    }
  }
};

const handleNodeClick = async (node) => {
  if (node.expanded) return;

  try {
    node.isLoading = true;

    // Contextual Brainstorming:
    let contextWords = [];
    let themes = [];

    if (graphRef.value && graphRef.value.nodes) {
      const selectedIds = graphRef.value.selectedNodeIds;
      contextWords = graphRef.value.nodes
        .filter((n) => selectedIds.includes(n.id) && n.id !== node.id)
        .map((n) => n.text);

      themes = graphRef.value.nodes
        .filter((n) => n.isCenter)
        .map((n) => n.text);

      if (strictMode.value) {
        // Link Bridge Mode: Trace path back from current node to root
        themes = []; // Reset themes to build path
        let current = node;
        themes.push(current.text);

        // Path for animation (Ids)
        const pathNodeIds = [current.id];

        const allLinks = graphRef.value.links || [];
        const allNodes = graphRef.value.nodes || [];

        // Trace back up to 20 levels
        for (let i = 0; i < 20; i++) {
          const parentLink = allLinks.find((l) => {
            const tId = typeof l.target === "object" ? l.target.id : l.target;
            return tId === current.id;
          });

          if (parentLink) {
            const sId =
              typeof parentLink.source === "object"
                ? parentLink.source.id
                : parentLink.source;
            const parent = allNodes.find((n) => n.id === sId);
            if (parent) {
              themes.unshift(parent.text);
              pathNodeIds.unshift(parent.id); // Add to start of path
              current = parent;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        // Trigger Animation Start
        if (graphRef.value && graphRef.value.startPathAnimation) {
          graphRef.value.startPathAnimation(pathNodeIds);
        }
      }
    }

    const count = parseInt(localStorage.getItem("generate_count") || 6);

    // Call API with all params including new mode params
    // Wait for at least 1.5s animation AND the api call
    const minAnimationTime = new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    // Perform API call
    const apiCall = getRelatedWords(
      node.text,
      count,
      contextWords,
      themes,
      strictMode.value,
      locale.value === "en" ? "English" : "Chinese",
      associationMode.value,
      customPrompt.value,
      documentContent.value
    );

    // Initial wait (optional optimization: if strict mode is off, we might not want to wait 1.5s?
    // But currently only doing animation in strict mode.
    // If NOT strict mode, we shouldn't force wait.
    let related;
    if (strictMode.value) {
      const [results] = await Promise.all([apiCall, minAnimationTime]);
      related = results;
      // Stop animation
      if (graphRef.value && graphRef.value.stopPathAnimation) {
        graphRef.value.stopPathAnimation();
      }
    } else {
      related = await apiCall;
    }

    if (related && Array.isArray(related)) {
      related.forEach((item) => {
        graphRef.value.addNode(item.word, "", node.id);
      });
      node.expanded = true;
      graphRef.value.clearSelection();

      setTimeout(() => {
        graphRef.value.panToNode(node);
      }, 500);
    }
  } catch (e) {
    console.error("Failed to expand", e);
    if (
      e.message &&
      e.message.includes("Missing") &&
      e.message.includes("Key")
    ) {
      showToastMessage(t("toast.missingKey"), "warning");
    } else {
      showToastMessage(t("toast.genFail"), "error");
    }
  } finally {
    node.isLoading = false;
  }
};

const handleNodeContextmenu = (node) => {
  if (graphRef.value) {
    graphRef.value.toggleSelection(node.id);
  }
};

// Reset Flow
const onResetRequest = () => {
  showResetModal.value = true;
};

const confirmReset = () => {
  if (graphRef.value) {
    graphRef.value.clearGraph();
    hasStarted.value = false;
    documentContent.value = "";
    associationMode.value = "related";
  }
  showResetModal.value = false;
};

// Settings Flow
const onSettingsRequest = () => {
  showSettingsModal.value = true;
};

const handleSettingsSave = () => {
  showSettingsModal.value = false;
};

// Export Flow
const onExportRequest = () => {
  if (!graphRef.value) return;

  const data = graphRef.value.exportGraphState();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `openmind_graph_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
};

// Import Flow
const fileInputRef = ref(null);

const onImportRequest = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ""; // Reset
    fileInputRef.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);
      if (graphRef.value) {
        const success = graphRef.value.importGraphState(json);
        if (success) {
          showToastMessage(t("toast.importSuccess"), "success");
          hasStarted.value = true;
        } else {
          showToastMessage(t("toast.importFailFormat"), "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToastMessage(t("toast.importFailParse"), "error");
    }
  };
  reader.readAsText(file);
};

// Start Document Upload
const docInputRef = ref(null);

const onRequestDocumentUpload = () => {
  if (docInputRef.value) {
    docInputRef.value.value = "";
    docInputRef.value.click();
  }
};

const handleDocFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      documentContent.value = e.target.result;
      showToastMessage(t("toast.docLoaded"), "success");
    };
    reader.readAsText(file);
  } else {
    // Fallback or warning for PDF/Docx
    showToastMessage(t("toast.docUnsupported"), "warning");
  }
};
// End Document Upload

// Custom Prompt Flow
const onRequestCustomPrompt = () => {
  showCustomPromptModal.value = true;
};

const saveCustomPrompt = (prompt) => {
  customPrompt.value = prompt;
  showCustomPromptModal.value = false;
};

// Fullscreen Flow
const onFullscreenRequest = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(
        `Error attempting to enable fullscreen: ${err.message} (${err.name})`
      );
    });
  } else {
    document.exitFullscreen();
  }
};

// Theme Color Flow
const onThemeColorRequest = () => {
  showThemeColorModal.value = true;
};

// Node Actions
const handleDeleteSelected = () => {
  if (graphRef.value && hasSelection.value) {
    graphRef.value.removeNodes(graphRef.value.selectedNodeIds);
  }
};

const handleEditSelected = () => {
  if (!graphRef.value || !hasSelection.value) return;

  const ids = graphRef.value.selectedNodeIds;
  const lastId = ids[ids.length - 1];
  const node = graphRef.value.nodes.find((n) => n.id === lastId);

  if (node) {
    editingNodeId.value = node.id;
    editingNodeText.value = node.text;
    showEditModal.value = true;
  }
};

const saveNodeEdit = (newText) => {
  if (editingNodeId.value && graphRef.value) {
    graphRef.value.updateNodeText(editingNodeId.value, newText);
  }
  showEditModal.value = false;
};

// Keyboard Shortcuts
const handleKeydown = (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (e.key.toLowerCase() === "d") {
    handleDeleteSelected();
  }
  if (e.key.toLowerCase() === "e") {
    handleEditSelected();
  }
  if (e.key.toLowerCase() === "f") {
    onFullscreenRequest();
  }
  if (e.key.toLowerCase() === "s") {
    onSettingsRequest();
  }
  if (e.key.toLowerCase() === "r") {
    onResetRequest();
  }
  if (e.key.toLowerCase() === "l") {
    strictMode.value = !strictMode.value;
  }
  if (e.key.toLowerCase() === "tab") {
    e.preventDefault();
    if (inputBarRef.value) {
      inputBarRef.value.focus();
    }
  }
};

// Dynamic Title Logic
watch(
  [() => graphRef.value?.nodes, associationMode, locale],
  ([newNodes, newMode]) => {
    if (!newNodes || newNodes.length === 0) {
      document.title = "OpenMind";
      return;
    }

    const centers = newNodes.filter((n) => n.isCenter);
    if (centers.length > 0) {
      const titles = centers.map((n) => n.text).join(", ");
      const modeLabel = t(`modes.${newMode}`) || newMode;
      document.title = `[${titles}] - ${modeLabel}`;
    } else {
      document.title = "OpenMind";
    }
  },
  { deep: true }
);

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);

  const storedColor = localStorage.getItem("theme_color");
  if (storedColor) {
    document.documentElement.style.setProperty("--color-primary", storedColor);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div id="app-container">
    <LogoPiece @click="showAboutModal = true" />

    <StrictModeToggle v-model="strictMode" />
    <LanguageSelector />
    <Toast
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />

    <!-- Graph State Import -->
    <input
      type="file"
      ref="fileInputRef"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- Document Content Import -->
    <input
      type="file"
      ref="docInputRef"
      accept=".txt,.md"
      style="display: none"
      @change="handleDocFileChange"
    />

    <GraphCanvas
      ref="graphRef"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextmenu"
    />

    <InputBar
      ref="inputBarRef"
      :has-started="hasStarted"
      v-model:associationMode="associationMode"
      @submit="handleInputSubmit"
      @request-custom-prompt="onRequestCustomPrompt"
      @request-document-upload="onRequestDocumentUpload"
    />

    <ControlPanel
      @reset="onResetRequest"
      @settings="onSettingsRequest"
      @export="onExportRequest"
      @import="onImportRequest"
      @fullscreen="onFullscreenRequest"
      @themeColor="onThemeColorRequest"
    />

    <Modal
      :show="showResetModal"
      :title="t('modal.reset.title')"
      :message="t('modal.reset.message')"
      @confirm="confirmReset"
      @cancel="showResetModal = false"
    />

    <SettingsModal
      :show="showSettingsModal"
      @close="showSettingsModal = false"
      @save="handleSettingsSave"
    />

    <AboutModal :show="showAboutModal" @close="showAboutModal = false" />

    <NodeActions
      :show="hasSelection"
      :can-edit="canEdit"
      @delete="handleDeleteSelected"
      @edit="handleEditSelected"
    />

    <EditNodeModal
      :show="showEditModal"
      :initial-text="editingNodeText"
      @close="showEditModal = false"
      @save="saveNodeEdit"
    />

    <CustomPromptModal
      :show="showCustomPromptModal"
      :initial-prompt="customPrompt"
      @close="showCustomPromptModal = false"
      @save="saveCustomPrompt"
    />

    <ThemeColorModal
      :show="showThemeColorModal"
      @close="showThemeColorModal = false"
    />
  </div>
</template>

<style>
#app-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
