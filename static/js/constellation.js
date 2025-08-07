// Import WebLLM for free, in-browser inference
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let messages = [];
let nodes = [{ id: 0, label: 'Start', type: 'root' }];
let links = [];
let idCounter = 0;
let svg, simulation;
let engine = null;
let isModelReady = false;

const SYSTEM_PROMPT = `You are an imaginative but concise game master guiding an interactive node-based adventure.
Return ONLY JSON with this shape:
{
  "narration": "one short sentence moving the story forward",
  "choices": ["short choice A", "short choice B", "short choice C"],
  "tags": ["topic", "theme"]
}
Rules:
- No prose outside JSON.
- Choices should be distinct branches.
- Keep total under 60 words.
`;

async function initLLM() {
  const statusEl = document.getElementById('status');
  const sendBtn = document.getElementById('sendBtn');
  const candidates = [
    'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    'Phi-1_5-q4f16_1-MLC',
    'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC'
  ];
  statusEl.textContent = 'Preparing AI (downloads once, runs in your browser)…';
  for (const model of candidates) {
    try {
      statusEl.textContent = `Loading model: ${model}…`;
      engine = await webllm.CreateMLCEngine(model, {
        appConfig: { useWebWorker: false },
      });
      await engine.chat.completions.create({
        messages: [ { role: 'system', content: SYSTEM_PROMPT } ],
        temperature: 0.7,
        max_tokens: 64,
      });
      isModelReady = true;
      statusEl.textContent = `AI ready (${model}). Click nodes or type to explore.`;
      if (sendBtn) sendBtn.disabled = false;
      return;
    } catch (err) {
      console.warn('Model load failed:', model, err);
    }
  }
  statusEl.textContent = 'AI failed to load. Using simple local rules instead.';
  isModelReady = false;
  if (sendBtn) sendBtn.disabled = false;
}

function initGraph() {
  svg = d3.select('#graph').append('svg')
    .attr('width', 900)
    .attr('height', 500);

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(140))
    .force('charge', d3.forceManyBody().strength(-320))
    .force('center', d3.forceCenter(450, 250))
    .on('tick', ticked);

  // Initial render
  ticked();
}

function ticked() {
  const link = svg.selectAll('line').data(links);
  link.join('line')
    .attr('stroke', '#94a3b8')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  const node = svg.selectAll('g.node').data(nodes, d => d.id);
  const nodeEnter = node.enter().append('g').classed('node', true)
    .on('click', (_, d) => expandNode(d))
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  nodeEnter.append('circle')
    .attr('r', 22)
    .attr('fill', d => d.type === 'root' ? '#10b981' : '#6366f1');
  nodeEnter.append('text').attr('dy', 4).attr('text-anchor', 'middle');

  node.merge(nodeEnter)
    .attr('transform', d => `translate(${d.x ?? 450},${d.y ?? 250})`)
    .select('text').text(d => d.label);

  node.exit().remove();
}

function dragstarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function addMessage(role, text) {
  const chat = document.getElementById('chat');
  const p = document.createElement('p');
  p.textContent = `${role === 'user' ? 'You' : 'AI'}: ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

function addNode(label, meta = {}) {
  const newNode = { id: ++idCounter, label, ...meta };
  nodes.push(newNode);
  links.push({ source: meta.parentId ?? 0, target: newNode.id });
  simulation.nodes(nodes);
  simulation.force('link').links(links);
  simulation.alpha(1).restart();
  return newNode;
}

function addChildren(parent, children) {
  children.forEach(label => addNode(label, { parentId: parent.id, type: 'choice' }));
}

function safeParseJSON(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function expandNode(node) {
  // Prevent expanding choice nodes repeatedly to control fanout
  if (node._expanded) return;
  node._expanded = true;

  addMessage('assistant', `Exploring: ${node.label}`);

  const userPrompt = `Context so far: ${nodes.filter(n => n.type !== 'root').map(n => n.label).join(' -> ') || 'start'}.
Player picked: ${node.label}. Continue.`;

  if (isModelReady && engine) {
    try {
      const completion = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 220,
      });
      const raw = completion?.choices?.[0]?.message?.content || '';
      const json = safeParseJSON(raw) || fallbackSuggester(node.label);
      handleAIResult(node, json, raw);
    } catch (e) {
      console.error(e);
      const json = fallbackSuggester(node.label);
      handleAIResult(node, json, JSON.stringify(json));
    }
  } else {
    const json = fallbackSuggester(node.label);
    handleAIResult(node, json, JSON.stringify(json));
  }
}

function handleAIResult(parentNode, aiJson, rawText) {
  const narration = aiJson?.narration || 'You venture onward.';
  const choices = Array.isArray(aiJson?.choices) && aiJson.choices.length > 0
    ? aiJson.choices.slice(0, 3)
    : ['Go left', 'Go right'];
  addMessage('assistant', narration);
  messages.push({ role: 'assistant', content: rawText });
  addChildren(parentNode, choices);
}

function fallbackSuggester(seed) {
  const base = [
    'A hidden path appears ahead.',
    'You notice a faint glow nearby.',
    'A stranger gestures for you to follow.',
  ];
  const idx = Math.abs(hashString(seed)) % base.length;
  return {
    narration: base[idx],
    choices: ['Investigate', 'Ignore and proceed', 'Ask for clues'],
    tags: ['fallback']
  };
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}

async function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  addMessage('user', text);
  messages.push({ role: 'user', content: text });

  // Treat user entry as a new branch label under root
  const newNode = addNode(text, { parentId: 0, type: 'choice' });
  await expandNode(newNode);
}

// Expose for inline onclick in the HTML
window.sendMessage = sendMessage;

document.addEventListener('DOMContentLoaded', async () => {
  initGraph();
  addMessage('assistant', 'Welcome! Click the Start node or type your first action.');
  await initLLM();

  // Make the root node clickable to kick things off
  const root = nodes[0];
  root.label = 'Start';
  ticked();

  const input = document.getElementById('userInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
