<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import GraphCanvas from './components/Graph/GraphCanvas.vue';
import InputBar from './components/UI/InputBar.vue';
import LogoPiece from './components/UI/LogoPiece.vue';
import ControlPanel from './components/UI/ControlPanel.vue';
import Modal from './components/UI/Modal.vue';
import SettingsModal from './components/UI/SettingsModal.vue';
import AboutModal from './components/UI/AboutModal.vue';
import NodeActions from './components/UI/NodeActions.vue';
import EditNodeModal from './components/UI/EditNodeModal.vue';
import StrictModeToggle from './components/UI/StrictModeToggle.vue';
import Toast from './components/UI/Toast.vue'; // New Import
import { getRelatedWords } from './services/gemini';

const graphRef = ref(null);
const hasStarted = ref(false);
const showResetModal = ref(false);
const showSettingsModal = ref(false);
const showAboutModal = ref(false);
const showEditModal = ref(false);
const showTranslation = ref(true);
const strictMode = ref(false);

// Toast State
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('warning');

const editingNodeId = ref(null);
const editingNodeText = ref('');

const showToastMessage = (msg, type = 'warning') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
};

const hasSelection = computed(() => {
  return graphRef.value && graphRef.value.selectedNodeIds && graphRef.value.selectedNodeIds.length > 0;
});

const canEdit = computed(() => {
  return hasSelection.value; // Logic: Always can edit if selected, but effective on Last Selected.
});

const handleInputSubmit = async (text) => {
  if (!text) return;
  hasStarted.value = true;
  
  if (graphRef.value) {
    // addNode will automatically attach to the last selected node
    graphRef.value.addNode(text, '');
    graphRef.value.clearSelection();
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
        .filter(n => selectedIds.includes(n.id) && n.id !== node.id) // Exclude current clicked node
        .map(n => n.text);
        
      // Requirements: Yellow nodes are Brainstorming Themes.
      // Gather all 'center' (yellow) nodes.
      themes = graphRef.value.nodes
        .filter(n => n.isCenter)
        .map(n => n.text);
    }
    
    // Call API with context and themes
    const count = parseInt(localStorage.getItem('generate_count') || 6);
    const related = await getRelatedWords(node.text, count, contextWords, themes, strictMode.value);
    
    if (related && Array.isArray(related)) {
      related.forEach(item => {
        graphRef.value.addNode(item.word, item.translation, node.id);
      });
      node.expanded = true;
      // Auto-deselect after generating new nodes
      graphRef.value.clearSelection();
    }
  } catch (e) {
    console.error("Failed to expand", e);
    if (e.message && e.message.includes("Missing") && e.message.includes("Key")) {
      showToastMessage("未配置 API Key，请在设置中配置", "warning"); // "Missing API Key, please configure in settings"
      // Optionally open settings? 
      // showSettingsModal.value = true; 
    } else {
       showToastMessage("生成失败，请重试", "error");
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
  
  const data = graphRef.value.getGraphData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `openmind_graph_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
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
  const node = graphRef.value.nodes.find(n => n.id === lastId);
  
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
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  if (e.key.toLowerCase() === 'd') {
    handleDeleteSelected();
  }
  if (e.key.toLowerCase() === 'e') {
    handleEditSelected();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div id="app-container">
    <LogoPiece @click="showAboutModal = true" />
    
    <StrictModeToggle v-model="strictMode" />
    <Toast v-if="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />
    
    <GraphCanvas
      ref="graphRef"
      :show-translation="showTranslation"
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextmenu"
    />

    
    <InputBar
      :has-started="hasStarted"
      @submit="handleInputSubmit"
    />
    
    <ControlPanel 
      :show-translation="showTranslation"
      @reset="onResetRequest"
      @settings="onSettingsRequest"
      @export="onExportRequest"
      @toggle-translation="showTranslation = !showTranslation"
    />
    
    <Modal
      :show="showResetModal"
      title="重置画布"
      message="确定要清空画布吗？此操作无法撤销。"
      @confirm="confirmReset"
      @cancel="showResetModal = false"
    />
    
    <SettingsModal
      :show="showSettingsModal"
      @close="showSettingsModal = false"
      @save="handleSettingsSave"
    />

    <AboutModal
      :show="showAboutModal"
      @close="showAboutModal = false"
    />

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
