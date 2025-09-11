// src/App.jsx
import { useState } from "react";
import GraphView from "./components/GraphView";
import ControlPanel from "./components/ControlPanel";
import {sendUpdate} from "./ws";

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const addNode = (id) => {
    const nid = Number(id);
    if (nodes.some(n => n.id === nid)) return;
    setNodes(prev => [...prev, { id: nid, highlight: true }]);
    sendUpdate({ op: "add_node", id: nid });
  };

  const addEdge = (u, v) => {
    const uu = Number(u), vv = Number(v);
    if (!nodes.find(n => n.id === uu) || !nodes.find(n => n.id === vv)) return;
    if (edges.find(e => (e.source === uu && e.target === vv) || (e.source === vv && e.target === uu))) return;
    setEdges(prev => [...prev, { source: uu, target: vv, highlight: true }]);
    sendUpdate({ op: "add_edge", u: uu, v: vv });
  };


  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <ControlPanel
        nodes={nodes}
        addNode={addNode}
        addEdge={addEdge}
      />

      <GraphView nodes={nodes} edges={edges} />
    </div>
  );
}

export default App;
