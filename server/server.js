const WebSocket = require("ws");
const { spawn } = require("child_process");

const wss = new WebSocket.Server({ port: 8080 });

// ✅ spawn the C++ engine
const graphCore = spawn("../graph-core/build/graph_core.exe");

// buffer for partial output
let buffer = "";

// read JSON responses from graph_core
graphCore.stdout.on("data", (data) => {
  buffer += data.toString();

  // handle multiple JSON messages separated by newlines
  let lines = buffer.split("\n");
  buffer = lines.pop(); // keep incomplete line

  for (const line of lines) {
    if (line.trim() !== "") {
      try {
        const msg = JSON.parse(line.trim());
        console.log("Engine response:", msg);

        // broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
          }
        });
      } catch (err) {
        console.error("Parse error:", err.message, "line:", line);
      }
    }
  }
});

graphCore.stderr.on("data", (data) => {
  console.error("Engine error:", data.toString());
});

graphCore.on("exit", (code) => {
  console.error(`graph_core exited with code ${code}`);
});

// ✅ handle client connections
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    console.log("Received from client:", msg.toString());

    // send command to C++ engine (end with newline!)
    graphCore.stdin.write(msg.toString().trim() + "\n");
  });

  ws.send(JSON.stringify({ type: "status", msg: "Connected to backend" }));
});

console.log("✅ WebSocket server running on ws://localhost:8080");
