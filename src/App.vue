<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
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
import Toast from "./components/UI/Toast.vue"; // New Import
import { getRelatedWords } from "./services/gemini";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const graphRef = ref(null);
const inputBarRef = ref(null);
const hasStarted = ref(false);
const showResetModal = ref(false);
const showSettingsModal = ref(false);
const showAboutModal = ref(false);
const showEditModal = ref(false);
const strictMode = ref(false);
// const selectedLanguage = ref(...) // Removed, using global i18n

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
  return hasSelection.value; // Logic: Always can edit if selected, but effective on Last Selected.
});

const handleInputSubmit = async (text) => {
  if (!text) return;
  hasStarted.value = true;

  if (graphRef.value) {
    // addNode will automatically attach to the last selected node
    const newNode = graphRef.value.addNode(text, "");
    graphRef.value.clearSelection();

    // Auto-center on the new node
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
    // Gather text from other selected nodes (Green/Blue ones) to guide the AI
    let contextWords = [];
    let themes = [];

    if (graphRef.value && graphRef.value.nodes) {
      const selectedIds = graphRef.value.selectedNodeIds;
      contextWords = graphRef.value.nodes
        .filter((n) => selectedIds.includes(n.id) && n.id !== node.id) // Exclude current clicked node
        .map((n) => n.text);

      // Requirements: Yellow nodes are Brainstorming Themes.
      // Gather all 'center' (yellow) nodes.
      themes = graphRef.value.nodes
        .filter((n) => n.isCenter)
        .map((n) => n.text);
    }

    // Call API with context and themes
    const count = parseInt(localStorage.getItem("generate_count") || 6);
    const related = await getRelatedWords(
      node.text,
      count,
      contextWords,
      themes,
      strictMode.value,
      locale.value === "en" ? "English" : "Chinese" // Pass appropriate string to API
    );

    if (related && Array.isArray(related)) {
      related.forEach((item) => {
        graphRef.value.addNode(item.word, "", node.id);
      });
      node.expanded = true;
      // Auto-deselect after generating new nodes
      graphRef.value.clearSelection();

      // Auto-center on the parent node after generation
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
  }
  showResetModal.value = false;
};

// Settings Flow
const onSettingsRequest = () => {
  showSettingsModal.value = true;
};

const handleSettingsSave = () => {
  // Key saved in component to localStorage.
  // We don't need to do anything else, next call will read it.
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

  // Edit the *Last Selected* node (Blue)
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
  // Ignore if typing in input fields

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

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
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

    <input
      type="file"
      ref="fileInputRef"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <GraphCanvas
      ref="graphRef"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextmenu"
    />

    <InputBar
      ref="inputBarRef"
      :has-started="hasStarted"
      @submit="handleInputSubmit"
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
  </div>
</template>

<style>
#app-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
