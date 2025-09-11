import { WebSocketServer } from "ws";
import { spawn } from "child_process";

const wss = new WebSocketServer({ port: 8080 });

// ✅ spawn the C++ engine
const graphCore = spawn("../graph-core/build/graph_core.exe");

let buffer = "";

// handle output from C++ engine
graphCore.stdout.on("data", (data) => {
  buffer += data.toString();
  let lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) {
    if (line.trim() !== "") {
      try {
        const msg = JSON.parse(line.trim());
        console.log("📡 Engine response:", msg);

        // inside buffer loop
        if (msg.op) {
          wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({ type: "log", msg: JSON.stringify(msg) }));
            }
          });
        }


        // broadcast to all connected clients
        // wss.clients.forEach((client) => {
        //   if (client.readyState === client.OPEN) {
        //     client.send(JSON.stringify(msg));
        //   }
        // });
      } catch (err) {
        console.error("❌ JSON parse error:", err.message, "line:", line);
      }
    }
  }
});

graphCore.stderr.on("data", (data) => {
  console.error("⚠️ Engine error:", data.toString());
});

graphCore.on("exit", (code) => {
  console.error(`❌ graph_core exited with code ${code}`);
});

// ✅ handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("✅ Client connected");

  ws.on("message", (msg) => {
  try {
    const json = JSON.parse(msg.toString());
    // simple validation
    if (!json.op) return;
    graphCore.stdin.write(JSON.stringify(json) + "\n");
  } catch {
    console.error("❌ Invalid JSON from client:", msg.toString());
  }
});


  ws.send(JSON.stringify({ type: "status", msg: "Connected to backend" }));
});

console.log("🚀 WebSocket server running at ws://localhost:8080");
