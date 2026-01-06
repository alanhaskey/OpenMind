<script setup>
import { ref } from 'vue';
import GraphCanvas from './components/Graph/GraphCanvas.vue';
import InputBar from './components/UI/InputBar.vue';
import LogoPiece from './components/UI/LogoPiece.vue';
import ControlPanel from './components/UI/ControlPanel.vue';
import Modal from './components/UI/Modal.vue';
import SettingsModal from './components/UI/SettingsModal.vue';
import AboutModal from './components/UI/AboutModal.vue';
import { getRelatedWords } from './services/gemini';

const graphRef = ref(null);
const hasStarted = ref(false);
const showResetModal = ref(false);
const showSettingsModal = ref(false);
const showAboutModal = ref(false);
const showTranslation = ref(true);

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
    if (graphRef.value && graphRef.value.nodes) {
      const selectedIds = graphRef.value.selectedNodeIds;
      contextWords = graphRef.value.nodes
        .filter(n => selectedIds.includes(n.id) && n.id !== node.id) // Exclude current clicked node
        .map(n => n.text);
    }
    
    // Call API with context
    const related = await getRelatedWords(node.text, 6, contextWords);
    
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
</script>

<template>
  <div id="app-container">
    <LogoPiece @click="showAboutModal = true" />
    
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
  </div>
</template>

<style>
#app-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
