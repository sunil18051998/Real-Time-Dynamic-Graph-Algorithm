// src/App.jsx
import { useState, useEffect } from "react";
import GraphView from "./components/GraphView";
import ControlPanel from "./components/ControlPanel";
import { connectWS, sendUpdate } from "./ws";

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWS((msg) => {
      if (!msg.op) return;

      // Update node communities
      if (msg.op === "update_community") {
        setNodes(prev =>
          prev.map(n => {
            const update = msg.nodes.find(x => x.id === n.id);
            return update ? { ...n, community: update.community } : n;
          })
        );
      }

      // Highlight shortest path edges
      if (msg.op === "shortest_path") {
        const pathNodes = msg.path;
        setEdges(prev =>
          prev.map(e => ({
            ...e,
            highlight: pathNodes.includes(e.source) && pathNodes.includes(e.target)
          }))
        );
      }

      // Optional: log messages
      if (msg.type === "log") {
        console.log("📝 Engine log:", msg.msg);
      }
    });
  }, []);

  // Add a new node
  const addNode = (id) => {
    const nid = Number(id);
    if (nodes.some(n => n.id === nid)) return;

    const nodeObj = { id: nid, label: `Node ${nid}` };
    setNodes(prev => [...prev, { ...nodeObj, highlight: true }]);

    sendUpdate({ op: "add_node", node: nodeObj });
  };

  // Add a new edge
  const addEdge = (u, v) => {
    const uu = Number(u), vv = Number(v);
    if (!nodes.find(n => n.id === uu) || !nodes.find(n => n.id === vv)) return;
    if (edges.find(e => (e.source === uu && e.target === vv) || (e.source === vv && e.target === uu))) return;

    const edgeObj = { source: uu, target: vv, weight: 1.0 };
    setEdges(prev => [...prev, { ...edgeObj, highlight: true }]);

    sendUpdate({ op: "add_edge", edge: edgeObj });
  };

  // Run shortest path
  const runShortestPath = (source, target) => {
    sendUpdate({ op: "shortest_path", source: Number(source), target: Number(target) });
  };

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <ControlPanel
        nodes={nodes}
        addNode={addNode}
        addEdge={addEdge}
        runShortestPath={runShortestPath}
      />
      <GraphView nodes={nodes} edges={edges} />
    </div>
  );
}

export default App;
