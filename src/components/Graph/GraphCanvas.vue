<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as d3 from 'd3';
import { useGraph } from '../../composables/useGraph';
import NodePiece from './NodePiece.vue';

const props = defineProps({
  showTranslation: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['node-click', 'node-contextmenu']);

const container = ref(null);
const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const transformStyle = ref({ transform: 'translate(0,0) scale(1)' });

const { nodes, links, initSimulation, updateDimensions, addNode, toggleSelection, selectedNodeIds, clearGraph, clearSelection, getGraphData, dragStarted, dragged, dragEnded } = useGraph(width.value, height.value);

const handleResize = () => {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  updateDimensions(width.value, height.value);
};

const initZoom = () => {
  if (!container.value) return;

  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      const { x, y, k } = event.transform;
      transformStyle.value = {
        transform: `translate(${x}px, ${y}px) scale(${k})`,
        transformOrigin: '0 0'
      };
    })
    // Filter out drag events on nodes to prevent zoom while dragging
    .filter((event) => {
      // If target is inside a node, ignore zoom drag
      return !event.target.closest('.node');
    });

  d3.select(container.value).call(zoom);
};

// Directive for Draggable Nodes
const vDraggable = {
  mounted(el, binding) {
    const node = binding.value;
    d3.select(el).call(
      d3.drag()
        .on('start', (event) => dragStarted(event, node))
        .on('drag', (event) => dragged(event, node))
        .on('end', (event) => dragEnded(event, node))
    );
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  initSimulation(width.value, height.value);
  initZoom();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

defineExpose({
  addNode,
  toggleSelection,
  selectedNodeIds,
  nodes,
  clearGraph,
  clearSelection,
  getGraphData,
});

// Helper for line coordinates
const getLineCoords = (link) => {
  return {
    x1: link.source.x || 0,
    y1: link.source.y || 0,
    x2: link.target.x || 0,
    y2: link.target.y || 0,
  };
};

const isNodeLastSelected = (node) => {
  if (selectedNodeIds.value.length === 0) return false;
  return node.id === selectedNodeIds.value[selectedNodeIds.value.length - 1];
};
</script>

<template>
  <div class="graph-container" ref="container">
    <div class="graph-content" :style="transformStyle">
      <svg class="graph-svg">
        <line
          v-for="link in links"
          :key="link.id || (link.source.id + '-' + link.target.id)"
          :x1="link.source.x"
          :y1="link.source.y"
          :x2="link.target.x"
          :y2="link.target.y"
          stroke="rgba(0,0,0,0.1)"
          stroke-width="1"
        />
      </svg>
      <div class="nodes-layer">
        <NodePiece
          v-for="node in nodes"
          :key="node.id"
          :node="node"
          :isLoading="node.isLoading"
          :show-translation="showTranslation"
          :is-last-selected="isNodeLastSelected(node)"
          v-draggable="node"
          @click="(n) => emit('node-click', n)"
          @contextmenu="(n) => emit('node-contextmenu', n)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  cursor: grab; /* Indicate draggable */
}

.graph-container:active {
  cursor: grabbing;
}

.graph-content {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

/* Rest of styles need to ensure they don't break zoom */
.graph-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible; /* Allow lines to extend beyond initial view */
}

.nodes-layer {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
}

.nodes-layer > * {
  pointer-events: auto;
}
</style>
