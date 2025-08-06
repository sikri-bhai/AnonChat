const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend files

let waiting = [];
let pairs = new Map();

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: "waiting", message: "Looking for a user..." }));

    pairClient(ws);

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            console.error("Invalid JSON:", data);
            return;
        }

        if (msg.type === "next") {
            const partner = pairs.get(ws);
            if (partner) {
                partner.send(JSON.stringify({ type: "info", message: "Your partner left. Reconnecting..." }));
                pairs.delete(partner);
                pairClient(partner);
            }
            pairs.delete(ws);
            ws.send(JSON.stringify({ type: "waiting", message: "Looking for a user..." }));
            pairClient(ws);
        } else if (msg.type === "chat") {
            const partner = pairs.get(ws);
            if (partner && partner.readyState === WebSocket.OPEN) {
                partner.send(JSON.stringify({ type: "chat", message: msg.message }));
            } else {
                ws.send(JSON.stringify({ type: "info", message: "No partner connected." }));
            }
        }
    });

    ws.on('close', () => {
        const index = waiting.indexOf(ws);
        if (index !== -1) waiting.splice(index, 1);
        const partner = pairs.get(ws);
        if (partner && partner.readyState === WebSocket.OPEN) {
            partner.send(JSON.stringify({ type: "info", message: "Your partner disconnected. Reconnecting..." }));
            pairs.delete(partner);
            pairClient(partner);
        }
        pairs.delete(ws);
    });
});

function pairClient(ws) {
    if (waiting.length > 0) {
        const partner = waiting.shift();
        pairs.set(ws, partner);
        pairs.set(partner, ws);

        ws.send(JSON.stringify({ type: "partner", message: "Connected to user!" }));
        partner.send(JSON.stringify({ type: "partner", message: "Connected to user!" }));
    } else {
        waiting.push(ws);
    }
}


server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
