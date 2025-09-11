// src/ws.js
let socket;

export function connectWS(onMessage) {
  socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    console.log("✅ Connected to WebSocket server");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("❌ Failed to parse WebSocket message:", event.data);
    }
  };

  socket.onclose = () => console.log("⚠️ WebSocket disconnected");
  socket.onerror = (err) => console.error("⚠️ WebSocket error:", err);
}

export function sendUpdate(cmd) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Send JSON directly to C++ engine
    socket.send(JSON.stringify(cmd));
  } else {
    console.warn("⚠️ WebSocket not open. Could not send:", cmd);
  }
}
