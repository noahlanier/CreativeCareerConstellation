// Basic network graph representation using vis.js
// Maintains a root node labelled 'Interest' and connects
// all subsequently added nodes to this root.

// Dataset for nodes and edges
const nodes = new vis.DataSet();
const edges = new vis.DataSet();

// Counter for assigning incremental node IDs beyond the root
let idCounter = 1;

// Add the root node when the page loads
function initConstellation() {
  // Only add if not already added
  if (!nodes.get(0)) {
    nodes.add({ id: 0, label: 'Interest' });
  }

  const container = document.getElementById('network');
  const data = { nodes, edges };
  const options = {};
  window.constellationNetwork = new vis.Network(container, data, options);
}

// Adds a new interest node and links it to the root
function addInterestNode(label) {
  // Initialize the constellation if it hasn't been initialized yet
  if (!window.constellationNetwork) {
    initConstellation();
  }

  const newId = idCounter++;
  nodes.add({ id: newId, label });
  edges.add({ from: 0, to: newId });
}

document.addEventListener('DOMContentLoaded', initConstellation);
