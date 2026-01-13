import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import * as d3 from 'd3';

export function useGraph(width, height) {
  const nodes = ref([]);
  const links = ref([]);
  const selectedNodeIds = ref([]); // Array of strings
  const hiddenRootIds = ref(new Set()); // Set of rootIds that are hidden
  const simulation = ref(null);

  // Computed properties for visible graph elements
  // We use these for the simulation to ensure hidden nodes don't affect layout
  const visibleNodes = computed(() => {
    return nodes.value.filter(n => !hiddenRootIds.value.has(n.rootId));
  });

  const visibleLinks = computed(() => {
    return links.value.filter(l => {
      // Handle both object references (d3) and raw IDs
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      
      const sourceNode = nodes.value.find(n => n.id === sId);
      const targetNode = nodes.value.find(n => n.id === tId);
      
      if (!sourceNode || !targetNode) return false;
      
      return !hiddenRootIds.value.has(sourceNode.rootId) && 
             !hiddenRootIds.value.has(targetNode.rootId);
    });
  });

  // Initialize simulation
  const initSimulation = (w, h) => {
    simulation.value = d3.forceSimulation(visibleNodes.value)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('link', d3.forceLink(visibleLinks.value).id(d => d.id).distance(100))
      // Custom collision force: only collide if same rootId
      .force('collide', (alpha) => {
        const nodes = visibleNodes.value;
        const radius = 55;
        const strength = 0.7; // Collision strength

        for (let i = 0; i < nodes.length; ++i) {
          for (let j = i + 1; j < nodes.length; ++j) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            
            // Only collide if they belong to the same sheet
            if (nodeA.rootId !== nodeB.rootId) continue;

            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            let l2 = dx * dx + dy * dy;
            const r = radius + radius; // Assumes fixed radius for now
            const r2 = r * r;

            if (l2 < r2) {
              if (l2 === 0) {
                 nodeA.vx += (Math.random() - 0.5) * 0.1;
                 nodeA.vy += (Math.random() - 0.5) * 0.1;
                 continue;
              }
              const l = Math.sqrt(l2);
              const overlap = r - l;
              const fx = (dx / l) * overlap * strength * alpha;
              const fy = (dy / l) * overlap * strength * alpha;

              nodeA.vx += fx;
              nodeA.vy += fy;
              nodeB.vx -= fx;
              nodeB.vy -= fy;
            }
          }
        }
      })
      .on('tick', () => {
        // Trigger reactivity for position updates
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

    // Determine rootId
    let rootId = id; // Default to self if no parent (new root)
    if (targetParentId) {
      const parent = nodes.value.find(n => n.id === targetParentId);
      if (parent) {
        rootId = parent.rootId || parent.id; // Inherit rootId
        
        // If parent is hidden, we should probably unhide the root to show the new node?
        // Or just let it be added but hidden. Let's unhide for better UX.
        if (hiddenRootIds.value.has(rootId)) {
          hiddenRootIds.value.delete(rootId);
        }
      }
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
      rootId: rootId // Assign rootId
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
    
    // Update simulation with visible nodes only
    simulation.value.nodes(visibleNodes.value);
    simulation.value.force('link').links(visibleLinks.value);
    simulation.value.alpha(1).restart();
  };

  const toggleSheetVisibility = (rootId) => {
    if (hiddenRootIds.value.has(rootId)) {
      const newSet = new Set(hiddenRootIds.value);
      newSet.delete(rootId);
      hiddenRootIds.value = newSet;
    } else {
      const newSet = new Set(hiddenRootIds.value);
      newSet.add(rootId);
      hiddenRootIds.value = newSet;
      // Deselect any nodes in the hidden sheet
      const hiddenNodes = nodes.value.filter(n => n.rootId === rootId);
      hiddenNodes.forEach(n => {
        if (n.isSelected) toggleSelection(n.id); // Toggle off
      });
    }
    restartSimulation();
  };

  const toggleSelection = (nodeId) => {
    const node = nodes.value.find(n => n.id === nodeId);
    // If node is hidden, don't select
    if (!node || hiddenRootIds.value.has(node.rootId)) return;

    const index = selectedNodeIds.value.indexOf(nodeId);

    if (index !== -1) {
      // Already selected, deselect it
      selectedNodeIds.value.splice(index, 1);
      node.isSelected = false;
    } else {
      // Not selected, try to add
      const limitStr = localStorage.getItem('max_selection_count');
      const limit = limitStr ? parseInt(limitStr) : Infinity;
      
      if (selectedNodeIds.value.length < limit) {
        selectedNodeIds.value.push(nodeId);
        node.isSelected = true;
      } else {
        console.warn(`Max selection reached (${limit})`);
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
    hiddenRootIds.value.clear();
    restartSimulation();
  };

  const clearSelection = () => {
    nodes.value.forEach(n => n.isSelected = false);
    selectedNodeIds.value = [];
  };

  const removeNodes = (nodeIds) => {
    if (!nodeIds || nodeIds.length === 0) return;

    // Find all descendants recursively
    const nodesToDelete = new Set(nodeIds);
    let stack = [...nodeIds];

    while (stack.length > 0) {
      const parentId = stack.pop();

      // Find children: links where source == parentId
      const childrenLinks = links.value.filter(l => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        return sId === parentId;
      });

      childrenLinks.forEach(link => {
        const tId = typeof link.target === 'object' ? link.target.id : link.target;
        if (!nodesToDelete.has(tId)) {
          nodesToDelete.add(tId);
          stack.push(tId);
        }
      });
    }

    const finalIds = Array.from(nodesToDelete);
    
    // Remove nodes
    nodes.value = nodes.value.filter(n => !nodesToDelete.has(n.id));
    
    // Remove connected links
    links.value = links.value.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return !nodesToDelete.has(sourceId) && !nodesToDelete.has(targetId);
    });

    // Clean up selection
    selectedNodeIds.value = selectedNodeIds.value.filter(id => !nodesToDelete.has(id));
    
    restartSimulation();
  };

  const updateNodeText = (nodeId, newText) => {
    const node = nodes.value.find(n => n.id === nodeId);
    if (node) {
      node.text = newText;
      // Also clear translation if text changes, or keep it?
      // Better clear it as it might not match.
      node.translation = ''; 
    }
  };

  const getGraphData = () => {
    // Human-readable format for "Management View"
    const centers = nodes.value.filter(n => n.isCenter);
    const themes = centers.length > 0 
      ? centers.map(c => c.text).join(', ')
      : 'Brainstorming Session';
    
    // Map connections to readable strings: "Source -> Target"
    const connections = links.value.map(l => {
      // D3 links might be objects (references) or IDs depending on state.
      // useGraph initSimulation uses .id(d=>d.id), so d3 replaces source/target with references.
      const sourceNode = typeof l.source === 'object' ? l.source : nodes.value.find(n => n.id === l.source);
      const targetNode = typeof l.target === 'object' ? l.target : nodes.value.find(n => n.id === l.target);
      
      const sourceName = sourceNode ? sourceNode.text : 'Unknown';
      const targetName = targetNode ? targetNode.text : 'Unknown';
      
      return `${sourceName} -> ${targetName}`;
    });

    return {
      "主题 (Theme)": themes,
      "关联脉络 (Associations)": connections,
      "节点列表 (All Concepts)": nodes.value.map(n => n.text)
    };
  };

  const exportGraphState = () => {
    return {
      nodes: nodes.value.map(n => ({
        ...n, 
        fx: null, 
        fy: null,
        // Ensure rootId is exported
        rootId: n.rootId
      })),
      links: links.value.map(l => {
        // Serialize links back to IDs
        const source = typeof l.source === 'object' ? l.source.id : l.source;
        const target = typeof l.target === 'object' ? l.target.id : l.target;
        return { source, target };
      })
    };
  };

  const importGraphState = (data) => {
    if (!data || !data.nodes) {
      console.warn("Invalid graph data");
      return false;
    }

    clearGraph();
    
    // Allow Vue to react to clearGraph first
    setTimeout(() => {
      // Reconstitute rootId if missing (for legacy data compatibility)
      // A naive approach for legacy data: assume islands are trees roughly?
      // Or just map isCenter=true to new rootIds.
      // Better: In a second pass or simple assumption.
      
      const importedNodes = data.nodes.map(n => ({
        ...n,
        x: n.x || width/2,
        y: n.y || height/2,
        vx: 0, 
        vy: 0,
        // Fallback for rootId
        rootId: n.rootId || (n.isCenter ? n.id : null)
      }));

      // If legacy data had no rootIds, children might still have null rootId.
      // We can try to repair it. 
      // Repair pass:
      const nodeMap = new Map(importedNodes.map(n => [n.id, n]));
      
      // We need to trace parents. Links are needed.
      const importedLinks = (data.links || []).map(l => ({
        source: l.source,
        target: l.target
      }));

      // Adjacency for parent lookup (Child -> Parent)
      const parentMap = new Map();
      importedLinks.forEach(l => {
        parentMap.set(l.target, l.source);
      });

      // Recursive function to find root
      const findRoot = (nodeId, visited = new Set()) => {
        if (visited.has(nodeId)) return nodeId; // Cycle? Return self as fail-safe
        visited.add(nodeId);
        
        const node = nodeMap.get(nodeId);
        if (!node) return nodeId;
        if (node.isCenter) return node.id;
        if (node.rootId) return node.rootId;
        
        const parentId = parentMap.get(nodeId);
        if (parentId) {
          const root = findRoot(parentId, visited);
          return root;
        }
        return nodeId; // Orphan? Treat as root
      };

      importedNodes.forEach(n => {
        if (!n.rootId) {
          n.rootId = findRoot(n.id);
        }
      });
      
      nodes.value = importedNodes;
      links.value = importedLinks;
      
      restartSimulation();
    }, 50);

    return true;
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
    visibleNodes,
    visibleLinks,
    addNode,
    toggleSelection,
    selectedNodeIds,
    hiddenRootIds,
    toggleSheetVisibility,
    initSimulation,
    updateDimensions,
    simulation,
    clearGraph,
    clearSelection,
    removeNodes,
    updateNodeText,
    getGraphData,
    dragStarted,
    dragged,
    dragEnded,
    exportGraphState,
    importGraphState
  };
}
