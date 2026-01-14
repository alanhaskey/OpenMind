<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import * as d3 from "d3";
import { useGraph } from "../../composables/useGraph";
import NodePiece from "./NodePiece.vue";

const props = defineProps({});

const emit = defineEmits(["node-click", "node-contextmenu"]);

const container = ref(null);
const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const transformStyle = ref({ transform: "translate(0,0) scale(1)" });

// Viewport State for Culling
const viewState = ref({ x: 0, y: 0, k: 1 });

// Highlight State (Persistent across culling)
const pathNodeIds = ref(new Set());
const contextNodeIds = ref(new Set());
const highlightedLinkKeys = ref(new Set());

const {
  nodes,
  links,
  visibleNodes,
  visibleLinks,
  initSimulation,
  updateDimensions,
  addNode,
  toggleSelection,
  selectedNodeIds,
  clearGraph,
  clearSelection,
  removeNodes,
  updateNodeText,
  getGraphData,
  dragStarted,
  dragged,
  dragEnded,
  exportGraphState,
  importGraphState,
  hiddenRootIds,
  toggleSheetVisibility,
} = useGraph(width.value, height.value);

const handleResize = () => {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  updateDimensions(width.value, height.value);
};

const zoomBehavior = ref(null);

const initZoom = () => {
  if (!container.value) return;

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      const { x, y, k } = event.transform;
      transformStyle.value = {
        transform: `translate(${x}px, ${y}px) scale(${k})`,
        transformOrigin: "0 0",
      };
      // Update View State for Culling
      viewState.value = { x, y, k };
    })
    // Filter out drag events on nodes to prevent zoom while dragging
    .filter((event) => {
      // If target is inside a node, ignore zoom drag
      return !event.target.closest(".node");
    });

  zoomBehavior.value = zoom;
  d3.select(container.value).call(zoom);
};

// --- Viewport Culling Logic ---

// Calculate the visible bounding box in graph coordinates
const viewportBounds = computed(() => {
  const { x, y, k } = viewState.value;
  // Buffer to render nodes slightly off-screen for smooth panning
  const buffer = 25;

  // Inverse transform: graphX = (screenX - tx) / k
  const minX = (0 - x) / k - buffer;
  const maxX = (width.value - x) / k + buffer;
  const minY = (0 - y) / k - buffer;
  const maxY = (height.value - y) / k + buffer;

  return { minX, maxX, minY, maxY };
});

const renderedNodes = computed(() => {
  const { minX, maxX, minY, maxY } = viewportBounds.value;
  return visibleNodes.value.filter((node) => {
    // Only check position, assuming node radius ~60px
    return (
      node.x >= minX - 60 &&
      node.x <= maxX + 60 &&
      node.y >= minY - 60 &&
      node.y <= maxY + 60
    );
  });
});

const renderedLinks = computed(() => {
  // Option 1: Only render links where BOTH nodes are visible (Strict Culling)
  // Option 2: Render links where AT LEAST ONE node is visible (Better UX)
  // Let's go with Option 2 to avoid links popping in too late.
  const { minX, maxX, minY, maxY } = viewportBounds.value;

  // Helper to check if a point is in bounds
  const inBounds = (x, y) =>
    x >= minX - 60 && x <= maxX + 60 && y >= minY - 60 && y <= maxY + 60;

  return visibleLinks.value.filter((link) => {
    // Check if source or target is in bounds
    // Note: link.source/target are objects from D3
    return (
      inBounds(link.source.x, link.source.y) ||
      inBounds(link.target.x, link.target.y)
    );
  });
});

// Helper to generate consistent link keys
const getLinkKey = (link) => {
  const sId = typeof link.source === "object" ? link.source.id : link.source;
  const tId = typeof link.target === "object" ? link.target.id : link.target;
  return `${sId}-${tId}`;
};

// Pan to center a node smoothly
const panToNode = (node) => {
  if (!container.value || !zoomBehavior.value) return;

  const containerWidth = width.value;
  const containerHeight = height.value;

  // Calculate the transform needed to center the node
  const currentTransform = d3.zoomTransform(container.value);
  const scale = currentTransform.k;

  // Target position: center of viewport
  const targetX = containerWidth / 2 - node.x * scale;
  const targetY = containerHeight / 2 - node.y * scale;

  // Animate to the new position
  d3.select(container.value)
    .transition()
    .duration(1500)
    .ease(d3.easeCubicInOut)
    .call(
      zoomBehavior.value.transform,
      d3.zoomIdentity.translate(targetX, targetY).scale(scale)
    );
};

// Directive for Draggable Nodes
const vDraggable = {
  mounted(el, binding) {
    const node = binding.value;
    d3.select(el).call(
      d3
        .drag()
        .subject(() => node)
        .on("start", (event) => dragStarted(event, node))
        .on("drag", (event) => dragged(event, node))
        .on("end", (event) => dragEnded(event, node))
    );
  },
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
  initSimulation(width.value, height.value);
  initZoom();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

defineExpose({
  addNode,
  toggleSelection,
  selectedNodeIds,
  nodes,
  clearGraph,
  clearSelection,
  removeNodes,
  updateNodeText,
  getGraphData,
  panToNode,
  exportGraphState,
  importGraphState,
  hiddenRootIds,
  toggleSheetVisibility,
  links,
  startPathAnimation: (nodeIds, cNodeIds = []) => {
    // 1. Highlight Path Nodes
    if (nodeIds && nodeIds.length > 0) {
      pathNodeIds.value = new Set(nodeIds);
    } else {
      pathNodeIds.value = new Set();
    }

    // 2. Highlight Context Nodes (Background Reference)
    if (cNodeIds && cNodeIds.length > 0) {
      // Filter out nodes that are already in path
      const filtered = cNodeIds.filter((id) => !pathNodeIds.value.has(id));
      contextNodeIds.value = new Set(filtered);
    } else {
      contextNodeIds.value = new Set();
    }

    // 3. Highlight Links
    highlightedLinkKeys.value = new Set();
    if (nodeIds && nodeIds.length >= 2) {
      for (let i = 0; i < nodeIds.length - 1; i++) {
        const source = nodeIds[i];
        const target = nodeIds[i + 1];
        // Add both directions just in case link is defined inversely
        highlightedLinkKeys.value.add(`${source}-${target}`);
        highlightedLinkKeys.value.add(`${target}-${source}`);
      }
    }
  },

  stopPathAnimation: () => {
    pathNodeIds.value.clear();
    contextNodeIds.value.clear();
    highlightedLinkKeys.value.clear();
  },
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
          v-for="link in renderedLinks"
          :key="getLinkKey(link)"
          :class="{
            'highlight-link': highlightedLinkKeys.has(getLinkKey(link)),
          }"
          :data-source="
            typeof link.source === 'object' ? link.source.id : link.source
          "
          :data-target="
            typeof link.target === 'object' ? link.target.id : link.target
          "
          :x1="link.source.x"
          :y1="link.source.y"
          :x2="link.target.x"
          :y2="link.target.y"
          stroke="rgba(0,0,0,0.1)"
          stroke-width="1"
        />
      </svg>
      <div class="nodes-layer">
        <TransitionGroup name="node-pop">
          <NodePiece
            v-for="node in renderedNodes"
            :key="node.id"
            :data-node-id="node.id"
            :node="node"
            :isLoading="node.isLoading"
            :expanded="node.expanded"
            :is-last-selected="isNodeLastSelected(node)"
            :is-highlighted="pathNodeIds.has(node.id)"
            :is-context="contextNodeIds.has(node.id)"
            v-draggable="node"
            @click="(n) => emit('node-click', n)"
            @contextmenu="(n) => emit('node-contextmenu', n)"
          />
        </TransitionGroup>
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

/* Node Pop Animation */
.node-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Elastic bounce */
}

.node-pop-leave-active {
  transition: all 0.3s ease-in;
}

.node-pop-enter-from,
.node-pop-leave-to {
  opacity: 0;
  transform: translate(var(--x), var(--y)) translate(-50%, -50%) scale(0);
}

/* Ensure stable position when not animating */
.node-pop-enter-to,
.node-pop-leave-from {
  opacity: 1;
  transform: translate(var(--x), var(--y)) translate(-50%, -50%) scale(1);
}

/* Link Bridge Mode Animations */
/* Link Bridge Mode Animations */
:deep(.highlight-link) {
  stroke: var(--color-primary, #3498db) !important;
  stroke-width: 4px !important;
  stroke-dasharray: 10, 5;
  animation: dash-flow 0.5s linear infinite;
  opacity: 1 !important;
  filter: drop-shadow(0 0 5px var(--color-primary, #3498db));
}

:deep(.highlight-node) {
  /* IMPORTANT: Must maintain the translate to keep position! */
  transform: translate(var(--x), var(--y)) translate(-50%, -50%);
  z-index: 100; /* Ensure on top */
  animation: node-pulse 0.5s ease-in-out infinite alternate;
}

@keyframes dash-flow {
  from {
    stroke-dashoffset: 15;
  }
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes node-pulse {
  from {
    box-shadow: 0 0 10px var(--color-primary, #3498db),
      inset 0 0 10px var(--color-primary, #3498db);
    border-color: var(--color-primary, #3498db);
  }
  to {
    box-shadow: 0 0 25px var(--color-primary, #3498db),
      inset 0 0 20px var(--color-primary, #3498db);
    border-color: white;
  }
}
</style>

<style scoped>
/* Append context styles ensuring they are present */
:deep(.highlight-context) {
  /* Context nodes get a different, steadier pulse */
  transform: translate(var(--x), var(--y)) translate(-50%, -50%);
  z-index: 90;
  animation: context-pulse 2s ease-in-out infinite alternate;
  border-style: dashed !important;
}

@keyframes context-pulse {
  from {
    box-shadow: 0 0 5px var(--color-primary);
    background: rgba(255, 255, 255, 0.05);
  }
  to {
    box-shadow: 0 0 15px var(--color-primary);
    background: color-mix(in srgb, var(--color-primary), transparent 90%);
  }
}
</style>
