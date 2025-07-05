let graph = { nodes: [], links: [] };
let lastIds = {};
let nextId = 0;
let svg, simulation;

function load() {
  const saved = localStorage.getItem("ccc-graph");
  if (saved) {
    graph = JSON.parse(saved);
    nextId = graph.nodes.reduce((m, n) => Math.max(m, n.id), -1) + 1;
    graph.nodes.forEach((n) => {
      lastIds[n.level] = n.id;
    });
  }
}

function save() {
  localStorage.setItem("ccc-graph", JSON.stringify(graph));
}

function addNode(level, label) {
  const id = nextId++;
  graph.nodes.push({ id, level, label });
  if (level > 0 && lastIds[level - 1] != null) {
    graph.links.push({ source: lastIds[level - 1], target: id });
  }
  lastIds[level] = id;
  save();
  restart();
}

function init() {
  load();
  svg = d3.select("#graph").append("svg").attr("class", "w-full h-full");

  simulation = d3
    .forceSimulation(graph.nodes)
    .force(
      "link",
      d3
        .forceLink(graph.links)
        .id((d) => d.id)
        .distance(80),
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(300, 200))
    .on("tick", ticked);

  restart();
}

function restart() {
  const link = svg.selectAll("line").data(graph.links);
  link.join("line").attr("stroke", "#999");

  const node = svg.selectAll("g").data(graph.nodes, (d) => d.id);
  const nodeEnter = node
    .enter()
    .append("g")
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded),
    );

  nodeEnter.append("circle").attr("r", 20).attr("fill", "#6366f1");
  nodeEnter
    .append("text")
    .attr("dy", 4)
    .attr("text-anchor", "middle")
    .text((d) => d.label);

  node.merge(nodeEnter);
  simulation.nodes(graph.nodes);
  simulation.force("link").links(graph.links);
  simulation.alpha(1).restart();
}

function ticked() {
  svg
    .selectAll("line")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  svg.selectAll("g").attr("transform", (d) => `translate(${d.x},${d.y})`);
}

function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

window.addEventListener("DOMContentLoaded", init);
document.addEventListener("new-node", (e) =>
  addNode(e.detail.level, e.detail.label),
);
