let socket;

export function connectWS(onMessage) {
  socket = new WebSocket("ws://localhost:8080");
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
}

export function sendUpdate(cmd) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    // Example: { op: "ADD_NODE", id: 5 }
    let command = "";

    if (cmd.op === "add_node") command = `ADD_NODE ${cmd.id}`;
    else if (cmd.op === "add_edge") command = `ADD_EDGE ${cmd.u} ${cmd.v}`;
    else if (cmd.op === "shortest_path") command = `SHORTEST_PATH ${cmd.u} ${cmd.v}`;

    if (command) {
      socket.send(command);
    }
  }
}
