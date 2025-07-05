let messages = [];
let nodes = [];
let links = [];
let idCounter = 0;
let svg, simulation;

document.addEventListener('DOMContentLoaded', () => {
    initGraph();
    // initial prompt from assistant
    const intro = "Hi! What is an activity you enjoy?";
    addMessage('assistant', intro);
    messages.push({role: 'assistant', content: intro});
});

function initGraph() {
    svg = d3.select('#graph').append('svg')
        .attr('width', 600)
        .attr('height', 400);

    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(300, 200))
        .on('tick', ticked);
}

function ticked() {
    const link = svg.selectAll('line').data(links);
    link.join('line')
        .attr('stroke', '#999')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    const node = svg.selectAll('g.node').data(nodes, d => d.id);
    const nodeEnter = node.enter().append('g').classed('node', true);
    nodeEnter.append('circle').attr('r', 20).attr('fill', '#66c');
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
    nodes.push({id: ++idCounter, label});
    links.push({source: 0, target: idCounter});
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
    messages.push({role: 'user', content: text});

    axios.post('/api/chat', {messages})
        .then(resp => {
            if (resp.data.error) {
                addMessage('assistant', resp.data.error);
                return;
            }
            const reply = resp.data.reply;
            addMessage('assistant', reply);
            messages.push({role: 'assistant', content: reply});
            try {
                const data = JSON.parse(reply);
                if (Array.isArray(data.careers)) {
                    data.careers.forEach(c => addNode(c));
                }
                if (data.question) {
                    addMessage('assistant', data.question);
                    messages.push({role: 'assistant', content: data.question});
                }
            } catch (e) {
                console.error('Failed to parse AI response as JSON');
            }
        })
        .catch(err => {
            console.error(err);
            const msg = err.response && err.response.data && err.response.data.error
                ? err.response.data.error
                : 'There was an error contacting the AI service.';
            addMessage('assistant', msg);
        });
}

