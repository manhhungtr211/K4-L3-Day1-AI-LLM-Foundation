// ── Model Info (fetched from server) ──────────────────────────────────────
let MODEL_INFO = { model: 'gpt-4o', mini_model: 'gpt-4o-mini' };

async function loadModelInfo() {
    try {
        const res = await fetch('/api/info');
        MODEL_INFO = await res.json();
        // Update all model selects
        document.querySelectorAll('.model-select').forEach(sel => {
            sel.innerHTML = `
                <option value="${MODEL_INFO.model}">${MODEL_INFO.model}</option>
                <option value="${MODEL_INFO.mini_model}">${MODEL_INFO.mini_model}</option>
            `;
        });
        // Update compare badges
        const b4o = document.querySelector('.model-badge.gpt4o');
        const bm = document.querySelector('.model-badge.mini');
        if (b4o) b4o.textContent = MODEL_INFO.model;
        if (bm) bm.textContent = MODEL_INFO.mini_model;
    } catch (e) { console.error('Failed to load model info', e); }
}

document.addEventListener('DOMContentLoaded', () => { loadModelInfo(); tokenCountLive(); });

// ── Tab Navigation ────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// ── Slider live values ────────────────────────────────────────────────────
document.querySelectorAll('.slider').forEach(s => {
    const valEl = document.getElementById(s.id + '-val');
    if (valEl) {
        s.addEventListener('input', () => { valEl.textContent = s.value; });
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────
function showLoading(text = 'Đang gọi API...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
}

function formatCost(usd) {
    if (usd < 0.000001) return '$0.000000';
    return '$' + usd.toFixed(6);
}

// ── 1. Playground ─────────────────────────────────────────────────────────
async function playgroundSend() {
    const prompt = document.getElementById('pg-prompt').value.trim();
    if (!prompt) return;

    showLoading('Đang gọi API...');
    try {
        const data = await apiPost('/api/call', {
            prompt,
            model: document.getElementById('pg-model').value,
            temperature: parseFloat(document.getElementById('pg-temp').value),
            top_p: parseFloat(document.getElementById('pg-topp').value),
            max_tokens: parseInt(document.getElementById('pg-maxtokens').value),
        });
        document.getElementById('pg-stats').style.display = 'flex';
        document.getElementById('pg-latency').textContent = data.latency + 's';
        document.getElementById('pg-tokens-in').textContent = data.tokens_in;
        document.getElementById('pg-tokens-out').textContent = data.tokens_out;
        document.getElementById('pg-cost').textContent = formatCost(data.cost.total_cost);
        document.getElementById('pg-response').textContent = data.response;
    } catch (e) {
        document.getElementById('pg-response').textContent = '❌ Lỗi: ' + e.message;
    }
    hideLoading();
}

// ── 2. Compare ────────────────────────────────────────────────────────────
async function compareSend() {
    const prompt = document.getElementById('cmp-prompt').value.trim();
    if (!prompt) return;

    showLoading('Đang so sánh 2 model...');
    try {
        const data = await apiPost('/api/compare', { prompt });

        document.getElementById('cmp-results').style.display = 'grid';
        document.getElementById('cmp-chart-card').style.display = 'block';

        document.getElementById('cmp-resp4o').textContent = data.gpt4o_response;
        document.getElementById('cmp-respmini').textContent = data.mini_response;
        document.getElementById('cmp-lat4o').textContent = data.gpt4o_latency + 's';
        document.getElementById('cmp-latmini').textContent = data.mini_latency + 's';
        document.getElementById('cmp-cost4o').textContent = formatCost(data.gpt4o_cost_estimate);
        document.getElementById('cmp-costmini').textContent = '~40x rẻ hơn';

        // Build bar chart
        const maxLat = Math.max(data.gpt4o_latency, data.mini_latency);
        document.getElementById('cmp-chart').innerHTML = `
            <div class="bar-row">
                <span class="bar-label">${MODEL_INFO.model} latency</span>
                <div class="bar-track">
                    <div class="bar-fill indigo" style="width:${(data.gpt4o_latency / maxLat * 100).toFixed(0)}%">${data.gpt4o_latency}s</div>
                </div>
            </div>
            <div class="bar-row">
                <span class="bar-label">${MODEL_INFO.mini_model} latency</span>
                <div class="bar-track">
                    <div class="bar-fill emerald" style="width:${(data.mini_latency / maxLat * 100).toFixed(0)}%">${data.mini_latency}s</div>
                </div>
            </div>
            <div class="bar-row">
                <span class="bar-label">${MODEL_INFO.model} words</span>
                <div class="bar-track">
                    <div class="bar-fill indigo" style="width:${Math.min(100, (data.gpt4o_response.split(' ').length / Math.max(data.gpt4o_response.split(' ').length, data.mini_response.split(' ').length) * 100)).toFixed(0)}%">${data.gpt4o_response.split(' ').length} từ</div>
                </div>
            </div>
            <div class="bar-row">
                <span class="bar-label">${MODEL_INFO.mini_model} words</span>
                <div class="bar-track">
                    <div class="bar-fill emerald" style="width:${Math.min(100, (data.mini_response.split(' ').length / Math.max(data.gpt4o_response.split(' ').length, data.mini_response.split(' ').length) * 100)).toFixed(0)}%">${data.mini_response.split(' ').length} từ</div>
                </div>
            </div>
        `;
    } catch (e) {
        document.getElementById('cmp-resp4o').textContent = '❌ ' + e.message;
    }
    hideLoading();
}

// ── 3. Persona ────────────────────────────────────────────────────────────
function setPersona(btn, text) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('persona-system').value = text;
}

async function personaSend() {
    const sys = document.getElementById('persona-system').value.trim();
    const usr = document.getElementById('persona-user').value.trim();
    if (!sys || !usr) return;

    showLoading('Đang gọi API với persona...');
    try {
        const data = await apiPost('/api/chat_system', {
            system_prompt: sys,
            user_prompt: usr,
        });
        document.getElementById('persona-stats').style.display = 'flex';
        document.getElementById('persona-latency').textContent = data.latency + 's';
        document.getElementById('persona-cost').textContent = formatCost(data.cost.total_cost);
        document.getElementById('persona-response').textContent = data.response;
    } catch (e) {
        document.getElementById('persona-response').textContent = '❌ ' + e.message;
    }
    hideLoading();
}

// ── 4. Temperature Explorer ───────────────────────────────────────────────
// async function temperatureTest() {
//     const prompt = document.getElementById('temp-prompt').value.trim();
//     if (!prompt) return;

//     const temps = [0.0, 0.5, 1.0, 1.5];

//     for (let i = 0; i < temps.length; i++) {
//         const el = document.getElementById(`temp-resp-${i}`);
//         el.innerHTML = '<div class="placeholder-text">⏳ Đang gọi...</div>';
//         document.getElementById(`temp-card-${i}`).style.opacity = '0.6';
//     }

//     for (let i = 0; i < temps.length; i++) {
//         try {
//             const data = await apiPost('/api/temperature_test', {
//                 prompt,
//                 temperature: temps[i],
//             });
//             document.getElementById(`temp-resp-${i}`).textContent = data.response;
//             document.getElementById(`temp-card-${i}`).style.opacity = '1';
//         } catch (e) {
//             document.getElementById(`temp-resp-${i}`).textContent = '❌ ' + e.message;
//             document.getElementById(`temp-card-${i}`).style.opacity = '1';
//         }
//     }
// }

// ── 5. Token Counter ──────────────────────────────────────────────────────
let tokenDebounce = null;
function tokenCountLive() {
    clearTimeout(tokenDebounce);
    tokenDebounce = setTimeout(async () => {
        const text = document.getElementById('tok-text').value;
        const model = document.getElementById('tok-model').value;
        try {
            const data = await apiPost('/api/count_tokens', { text, model });
            document.getElementById('tok-count').textContent = data.tokens;
            document.getElementById('tok-chars').textContent = data.characters;
            document.getElementById('tok-words').textContent = data.words;
            document.getElementById('tok-ratio').textContent = data.tokens > 0
                ? (data.characters / data.tokens).toFixed(1)
                : '—';

            // Cost estimates
            const toks = data.tokens;
            document.getElementById('tok-cost-4o').textContent = formatCost(toks / 1000 * 0.0025);
            document.getElementById('tok-cost-mini').textContent = formatCost(toks / 1000 * 0.00015);
        } catch (e) {
            console.error(e);
        }
    }, 300);
}

// Run initial token count
document.addEventListener('DOMContentLoaded', () => { tokenCountLive(); });

// ── 6. Streaming Chat ─────────────────────────────────────────────────────
let chatHistory = [];

function chatKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatSend();
    }
}

async function chatSend() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    // Remove welcome
    const welcome = document.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const messagesEl = document.getElementById('chat-messages');

    // Add user message
    chatHistory.push({ role: 'user', content: text });
    messagesEl.innerHTML += `
        <div class="chat-message user">
            <div class="chat-avatar">👤</div>
            <div class="chat-bubble">${escapeHtml(text)}</div>
        </div>`;

    // Add assistant placeholder
    const msgId = 'msg-' + Date.now();
    messagesEl.innerHTML += `
        <div class="chat-message assistant">
            <div class="chat-avatar">🤖</div>
            <div class="chat-bubble typing-cursor" id="${msgId}"></div>
        </div>`;
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Disable send button
    document.getElementById('chat-send-btn').disabled = true;

    try {
        const res = await fetch('/api/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = '';
        const bubbleEl = document.getElementById(msgId);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split('\n');
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const payload = JSON.parse(line.slice(6));
                    if (payload.content) {
                        fullReply += payload.content;
                        bubbleEl.textContent = fullReply;
                        messagesEl.scrollTop = messagesEl.scrollHeight;
                    }
                    if (payload.done) {
                        bubbleEl.classList.remove('typing-cursor');
                    }
                } catch (_) { }
            }
        }

        chatHistory.push({ role: 'assistant', content: fullReply });
        // Trim history to last 3 turns (6 messages)
        if (chatHistory.length > 6) {
            chatHistory = chatHistory.slice(-6);
        }
    } catch (e) {
        document.getElementById(msgId).textContent = '❌ ' + e.message;
        document.getElementById(msgId).classList.remove('typing-cursor');
    }

    document.getElementById('chat-send-btn').disabled = false;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
