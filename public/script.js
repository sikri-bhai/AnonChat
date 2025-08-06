const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send');
const nextBtn = document.getElementById('next');

let lastMessageTime = 0;
const ws = new WebSocket('ws://' + location.host);

ws.onopen = () => {
    clearChat();
    appendMessage('Looking for a user...', 'stranger');  // Default text before connecting
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'partner') {
            clearChat();
            appendMessage('New user connected.', 'stranger');
        }
        if (data.type === 'chat') {
            appendMessage(data.message, 'stranger');
        }
    } catch (error) {
        console.error("Invalid message received:", event.data);
    }
};

ws.onclose = () => {
    appendMessage("Connection lost. Reconnecting...", 'stranger');
    setTimeout(() => location.reload(), 3000);
};

// Function to send message
function sendMessage() {
    const now = Date.now();
    if (now - lastMessageTime < 1000) return;  // Prevent spam
    lastMessageTime = now;

    const text = messageInput.value.trim();
    if (text) {
        ws.send(JSON.stringify({ type: 'chat', message: text }));
        appendMessage(text, 'me');
        messageInput.value = '';
    }
}

sendBtn.onclick = sendMessage;

// Send message when Enter is pressed
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

nextBtn.onclick = () => {
    ws.send(JSON.stringify({ type: 'next' }));
    nextBtn.classList.add('disabled');
    setTimeout(() => { nextBtn.classList.remove('disabled'); }, 2000);
    clearChat();
    appendMessage('Searching for a new partner...', 'stranger');
};

function appendMessage(msg, sender) {
    const p = document.createElement('div');
    p.textContent = msg;
    p.classList.add('message', sender === 'me' ? 'my-message' : 'stranger-message');
    chatDiv.appendChild(p);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function clearChat() {
    chatDiv.innerHTML = '';
}
