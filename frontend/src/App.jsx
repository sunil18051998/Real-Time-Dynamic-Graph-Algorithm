import { useState } from "react";
import GraphView from "./components/GraphView";
import ControlPanel from "./components/ControlPanel";
import Sidebar from "./components/Sidebar";
import { sendUpdate } from "./ws";

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [lastAction, setLastAction] = useState("");

  const addNode = (id) => {
    const nid = Number(id);
    if (nodes.some(n => n.id === nid)) return;
    setNodes(prev => [...prev, { id: nid, highlight: true }]);
    setLastAction(`Added Node ${nid}`);
    sendUpdate({ op: "add_node", id: nid });
  };

  const addEdge = (u, v) => {
    const uu = Number(u), vv = Number(v);
    if (!nodes.find(n => n.id === uu) || !nodes.find(n => n.id === vv)) return;
    if (edges.find(e => (e.source === uu && e.target === vv) || (e.source === vv && e.target === uu))) return;
    setEdges(prev => [...prev, { source: uu, target: vv, highlight: true }]);
    setLastAction(`Added Edge ${uu} → ${vv}`);
    sendUpdate({ op: "add_edge", u: uu, v: vv });
  };

  // Algorithm callbacks (for demo, can call backend later)
 const runShortestPath = (sourceId, targetId) => {
  if (sourceId === targetId) return;
  const visited = {};
  const parent = {};
  const queue = [sourceId];
  visited[sourceId] = true;

  // Build adjacency map
const adj = {};
nodes.forEach(n => adj[n.id] = []);

// Ensure e.source/e.target are numeric IDs
edges.forEach(e => {
  const u = typeof e.source === "object" ? e.source.id : e.source;
  const v = typeof e.target === "object" ? e.target.id : e.target;

  if (adj[u] && adj[v]) {
    adj[u].push(v);
    adj[v].push(u);
  }
});

  // BFS
  while (queue.length) {
    const curr = queue.shift();
    if (curr === targetId) break;
    adj[curr].forEach(nei => {
      if (!visited[nei]) {
        visited[nei] = true;
        parent[nei] = curr;
        queue.push(nei);
      }
    });
  }

  // Reconstruct path
  let path = [];
  let node = targetId;
  while (node !== undefined) {
    path.push(node);
    node = parent[node];
  }
  path = path.reverse();

  if (path[0] !== sourceId) {
    setLastAction(`No path found from ${sourceId} → ${targetId}`);
    return;
  }

  setLastAction(`Shortest Path: ${path.join(" → ")}`);

  // Highlight nodes and edges in path
  setNodes(prev => prev.map(n => ({
    ...n,
    highlight: path.includes(n.id),
  })));

  setEdges(prev => prev.map(e => ({
    ...e,
    highlight: path.includes(e.source) && path.includes(e.target)
  })));

  // Reset highlight after 2s
  setTimeout(() => {
    setNodes(prev => prev.map(n => ({ ...n, highlight: false })));
    setEdges(prev => prev.map(e => ({ ...e, highlight: false })));
  }, 2000);
};


  const runLouvain = () => {
    setLastAction("Louvain Communities Updated (Demo)");
  };

  const resetGraph = () => {
    setNodes([]);
    setEdges([]);
    setLastAction("Graph Reset");
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-col gap-4 p-4 w-72">
        <ControlPanel nodes={nodes} addNode={addNode} addEdge={addEdge} />
      </div>
      <div className="flex-1 relative">
        <GraphView nodes={nodes} edges={edges} />
      </div>
      <Sidebar
        nodes={nodes}
        edges={edges}
        addLog={lastAction}
        runShortestPath={runShortestPath}
        runLouvain={runLouvain}
        resetGraph={resetGraph}
      />
    </div>
  );
}
