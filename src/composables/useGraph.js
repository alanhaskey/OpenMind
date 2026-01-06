import { ref, reactive, onMounted, onUnmounted } from 'vue';
import * as d3 from 'd3';

export function useGraph(width, height) {
  const nodes = ref([]);
  const links = ref([]);
  const selectedNodeIds = ref([]); // Array of strings
  const simulation = ref(null);

  // Initialize simulation
  const initSimulation = (w, h) => {
    simulation.value = d3.forceSimulation(nodes.value)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('link', d3.forceLink(links.value).id(d => d.id).distance(100))
      .force('collide', d3.forceCollide().radius(60).iterations(2))
      .on('tick', () => {
        // Trigger reactivity for position updates if needed
      });
  };

  const addNode = (text, translation = '', parentId = null) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    
    // Logic: Input connects to Last Selected only (User Req #2)
    // If parentId is explicitly passed (e.g. from expansion), use it.
    // If not (e.g. from InputBar), use the last selected node.
    let targetParentId = parentId;
    if (!targetParentId && selectedNodeIds.value.length > 0) {
      targetParentId = selectedNodeIds.value[selectedNodeIds.value.length - 1];
    }

    const newNode = {
      id,
      text,
      translation,
      x: width / 2 + (Math.random() - 0.5) * 50,
      y: height / 2 + (Math.random() - 0.5) * 50,
      isSelected: false,
      isCenter: !targetParentId,
      expanded: false,
    };

    if (targetParentId) {
      const parent = nodes.value.find(n => n.id === targetParentId);
      if (parent) {
        newNode.x = parent.x + (Math.random() - 0.5) * 20;
        newNode.y = parent.y + (Math.random() - 0.5) * 20;
      }
    }

    nodes.value.push(newNode);

    if (targetParentId) {
      links.value.push({ source: targetParentId, target: id });
    }

    restartSimulation();
    return newNode;
  };

  const restartSimulation = () => {
    if (!simulation.value) return;
    
    simulation.value.nodes(nodes.value);
    simulation.value.force('link').links(links.value);
    simulation.value.alpha(1).restart();
  };

  const toggleSelection = (nodeId) => {
    const node = nodes.value.find(n => n.id === nodeId);
    if (!node) return;

    const index = selectedNodeIds.value.indexOf(nodeId);

    if (index !== -1) {
      // Already selected, deselect it
      selectedNodeIds.value.splice(index, 1);
      node.isSelected = false;
    } else {
      // Not selected, try to add
      if (selectedNodeIds.value.length < 5) {
        selectedNodeIds.value.push(nodeId);
        node.isSelected = true;
      } else {
        // Optional: Alert user or ignore? User said "Max 5".
        // For better UX, we could replace the first one? 
        // User request: "max 5 multi-select limit". 
        // We'll strict limit for now.
        console.warn("Max selection reached (5)");
      }
    }
  };

  const updateDimensions = (w, h) => {
    if (simulation.value) {
      simulation.value.force('center', d3.forceCenter(w / 2, h / 2));
      simulation.value.alpha(0.3).restart();
    }
  };

  const clearGraph = () => {
    nodes.value = [];
    links.value = [];
    selectedNodeIds.value = [];
    restartSimulation();
  };

  const clearSelection = () => {
    nodes.value.forEach(n => n.isSelected = false);
    selectedNodeIds.value = [];
  };

  const getGraphData = () => {
    // Human-readable format for "Management View"
    const center = nodes.value.find(n => n.isCenter);
    const theme = center ? `${center.text} (${center.translation || 'Center'})` : 'Brainstorming Session';
    
    // Map connections to readable strings: "Source -> Target"
    const connections = links.value.map(l => {
      // D3 links might be objects (references) or IDs depending on state.
      // useGraph initSimulation uses .id(d=>d.id), so d3 replaces source/target with references.
      const sourceNode = typeof l.source === 'object' ? l.source : nodes.value.find(n => n.id === l.source);
      const targetNode = typeof l.target === 'object' ? l.target : nodes.value.find(n => n.id === l.target);
      
      const sourceName = sourceNode ? sourceNode.text : 'Unknown';
      const targetName = targetNode ? `${targetNode.text} (${targetNode.translation})` : 'Unknown';
      
      return `${sourceName} -> ${targetName}`;
    });

    return {
      "主题 (Theme)": theme,
      "关联脉络 (Associations)": connections,
      "节点列表 (All Concepts)": nodes.value.map(n => `${n.text} ${n.translation ? '('+n.translation+')' : ''}`)
    };
  };

  // Drag handlers
  const dragStarted = (event, node) => {
    if (!event.active) simulation.value.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  };

  const dragged = (event, node) => {
    node.fx = event.x;
    node.fy = event.y;
  };

  const dragEnded = (event, node) => {
    if (!event.active) simulation.value.alphaTarget(0);
    // User requested natural movement, so we release the node.
    // This allows the force simulation to take over (centering, collision, links).
    node.fx = null;
    node.fy = null;
  };

  return {
    nodes,
    links,
    addNode,
    toggleSelection,
    selectedNodeIds,
    initSimulation,
    updateDimensions,
    simulation,
    clearGraph,
    clearSelection,
    getGraphData,
    dragStarted,
    dragged,
    dragEnded
  };
}
