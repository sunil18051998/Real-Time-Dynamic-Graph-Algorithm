
import { useState, useEffect } from "react";
import GraphView from "./components/GraphView";
import ControlPanel from "./components/ControlPanel";
import Sidebar from "./components/Sidebar";
import { connectWS, sendUpdate } from "./ws";

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [logs, setLogs] = useState([]);

  // Connect WebSocket
  useEffect(() => {
    connectWS((msg) => {
      if (!msg) return;

      // Update communities from Louvain
      if (msg.op === "update_community") {
        setNodes((prev) =>
          prev.map((n) => {
            const update = msg.nodes.find((x) => x.id === n.id);
            return update ? { ...n, community: update.community } : n;
          })
        );
        setLogs((prev) => [msg, ...prev]);
      }

      // Highlight shortest path edges
      if (msg.op === "shortest_path") {
        const pathNodes = msg.path;
        setEdges((prev) =>
          prev.map((e) => ({
            ...e,
            highlight: pathNodes.includes(e.source) && pathNodes.includes(e.target),
          }))
        );
        setLogs((prev) => [msg, ...prev]);
      }

      // Generic logs
      if (msg.type === "log") {
        setLogs((prev) => [msg, ...prev]);
      }
    });
  }, []);

  // Add node
  const addNode = (id) => {
    const nid = Number(id);
    if (nodes.some((n) => n.id === nid)) return;
    const nodeObj = { id: nid, label: `Node ${nid}`, community: nid, x: Math.random() * 600 + 100, y: Math.random() * 400 + 100 };
    setNodes((prev) => [...prev, { ...nodeObj, highlight: true }]);
    sendUpdate({ op: "ADD_NODE", node: nodeObj });
    setLogs((prev) => [`Node ${nid} added`, ...prev]);
  };

  // Add edge
  const addEdge = (u, v) => {
    const uu = Number(u),
      vv = Number(v);
    if (!nodes.find((n) => n.id === uu) || !nodes.find((n) => n.id === vv)) return;
    if (edges.find((e) => (e.source === uu && e.target === vv) || (e.source === vv && e.target === uu))) return;

    const edgeObj = { source: uu, target: vv, weight: 1.0 };
    setEdges((prev) => [...prev, { ...edgeObj, highlight: true }]);
    sendUpdate({ op: "ADD_EDGE", edge: edgeObj });
    setLogs((prev) => [`Edge ${uu} -> ${vv} added`, ...prev]);
  };

  // Run shortest path
  const runShortestPath = (source, target) => {
    sendUpdate({ op: "SHORTEST_PATH", source: Number(source), target: Number(target) });
    setLogs((prev) => [`Shortest path requested: ${source} -> ${target}`, ...prev]);
  };

  // Run Louvain on all nodes or selected nodes
  const runLouvain = () => {
    const nodeIds = nodes.map((n) => n.id);
    sendUpdate({ op: "RUN_LOUVAIN", touched: nodeIds });
    setLogs((prev) => [`Louvain community detection requested for nodes: [${nodeIds.join(", ")}]`, ...prev]);
  };

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <ControlPanel
        nodes={nodes}
        addNode={addNode}
        addEdge={addEdge}
        runShortestPath={runShortestPath}
        runLouvain={runLouvain}
      />
      <GraphView nodes={nodes} edges={edges} />
      <Sidebar logs={logs} />
    </div>
  );
}

export default App;

