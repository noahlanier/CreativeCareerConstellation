let messages = [];
let nodes = [{id: 0, label: 'Interest'}];
let links = [];
let idCounter = 0;
let svg, simulation;

// Simple in-browser suggestion engine to avoid any server/API
function generateSuggestions(userText) {
  const text = userText.toLowerCase();
  const suggestions = { careers: [], skills: [], question: '' };

  const rules = [
    { kw: ['music', 'sing', 'guitar', 'piano', 'band'], careers: ['Musician', 'Sound Engineer'], skills: ['practice', 'songwriting', 'audio mixing'] },
    { kw: ['video', 'film', 'movie', 'camera'], careers: ['Filmmaker', 'Video Editor'], skills: ['camera operation', 'storyboarding'] },
    { kw: ['draw', 'paint', 'art', 'design'], careers: ['Illustrator', 'Graphic Designer'], skills: ['sketching', 'color theory'] },
    { kw: ['game', 'minecraft', 'roblox', 'play'], careers: ['Game Designer', 'Game Developer'], skills: ['level design', 'coding basics'] },
    { kw: ['code', 'program', 'python', 'javascript'], careers: ['Software Developer', 'Data Scientist'], skills: ['problem solving', 'algorithms'] },
    { kw: ['read', 'book', 'write', 'story'], careers: ['Writer', 'Editor'], skills: ['creative writing', 'editing'] },
    { kw: ['sports', 'soccer', 'basketball', 'run'], careers: ['Athlete', 'Coach'], skills: ['teamwork', 'training'] },
    { kw: ['nature', 'animal', 'plant', 'outdoor'], careers: ['Biologist', 'Park Ranger'], skills: ['observation', 'research'] },
  ];

  for (const rule of rules) {
    if (rule.kw.some(k => text.includes(k))) {
      suggestions.careers.push(...rule.careers);
      suggestions.skills.push(...rule.skills);
    }
  }

  if (suggestions.careers.length === 0) {
    suggestions.careers = ['Creator', 'Explorer'];
    suggestions.skills = ['curiosity', 'practice'];
  }

  suggestions.question = 'What else do you enjoy?';
  return suggestions;
}

document.addEventListener('DOMContentLoaded', () => {
  initGraph();
  const intro = 'Hi! What is an activity you enjoy?';
  addMessage('assistant', intro);
  messages.push({ role: 'assistant', content: intro });

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

function initGraph() {
  svg = d3.select('#graph').append('svg')
    .attr('width', 900)
    .attr('height', 500);

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(140))
    .force('charge', d3.forceManyBody().strength(-320))
    .force('center', d3.forceCenter(450, 250))
    .on('tick', ticked);
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
  const nodeEnter = node.enter().append('g').classed('node', true);
  nodeEnter.append('circle').attr('r', 20).attr('fill', '#6366f1');
  nodeEnter.append('text').attr('dy', 4).attr('text-anchor', 'middle');
  node.merge(nodeEnter).attr('transform', d => `translate(${d.x},${d.y})`)
    .select('text').text(d => d.label);
  node.exit().remove();
}

function addMessage(role, text) {
  const chat = document.getElementById('chat');
  const p = document.createElement('p');
  p.textContent = `${role === 'user' ? 'You' : 'AI'}: ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

function addNode(label) {
  nodes.push({ id: ++idCounter, label });
  links.push({ source: 0, target: idCounter });
  simulation.nodes(nodes);
  simulation.force('link').links(links);
  simulation.alpha(1).restart();
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessage('user', text);
  messages.push({ role: 'user', content: text });

  // Generate local suggestions instead of calling a server
  const data = generateSuggestions(text);
  const reply = JSON.stringify(data);
  addMessage('assistant', reply);
  messages.push({ role: 'assistant', content: reply });

  if (Array.isArray(data.careers)) {
    data.careers.forEach(c => addNode(c));
  }
  if (data.question) {
    addMessage('assistant', data.question);
    messages.push({ role: 'assistant', content: data.question });
  }
}
