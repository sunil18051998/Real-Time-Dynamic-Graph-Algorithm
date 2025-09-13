// // src/App.jsx
// import { useState, useEffect } from "react";
// import GraphView from "./components/GraphView";
// import ControlPanel from "./components/ControlPanel";
// import Sidebar from "./components/Sidebar";
// import { connectWS, sendUpdate } from "./ws";

// function App() {
//   const [nodes, setNodes] = useState([]);
//   const [edges, setEdges] = useState([]);
//   const [logs, setLogs] = useState([]);

//   // Connect WebSocket on mount
//   useEffect(() => {
//     connectWS((msg) => {
//       if (msg.log) {
//         // Generic log from backend
//         setLogs(prev => [msg.log, ...prev]);
//         return;
//       }

//       switch (msg.op) {
//         case "update_community":
//           setNodes(prev =>
//             prev.map(n => {
//               const update = msg.nodes.find(x => x.id === n.id);
//               return update ? { ...n, community: update.community } : n;
//             })
//           );
//           setLogs(prev => [msg, ...prev]);
//           break;

//         case "shortest_path":
//           const pathNodes = msg.path;
//           setEdges(prev =>
//             prev.map(e => ({
//               ...e,
//               highlight: pathNodes.includes(e.source) && pathNodes.includes(e.target)
//             }))
//           );
//           setLogs(prev => [msg, ...prev]);
//           break;

//         default:
//           // fallback log
//           setLogs(prev => [msg, ...prev]);
//           break;
//       }
//     });
//   }, []);

//   // Add a new node
//   const addNode = (id) => {
//     const nid = Number(id);
//     if (nodes.some(n => n.id === nid)) return;

//     const nodeObj = { id: nid, label: `Node ${nid}` };
//     setNodes(prev => [...prev, { ...nodeObj, highlight: true }]);
//     sendUpdate({ op: "add_node", id: nid });
//     setLogs(prev => [`Node ${nid} added`, ...prev]);
//   };

//   // Add a new edge
//   const addEdge = (u, v) => {
//     const uu = Number(u), vv = Number(v);
//     if (!nodes.find(n => n.id === uu) || !nodes.find(n => n.id === vv)) return;
//     if (edges.find(e => (e.source === uu && e.target === vv) || (e.source === vv && e.target === uu))) return;

//     const edgeObj = { source: uu, target: vv, weight: 1.0 };
//     setEdges(prev => [...prev, { ...edgeObj, highlight: true }]);
//     sendUpdate({ op: "add_edge", u: uu, v: vv });
//     setLogs(prev => [`Edge ${uu} → ${vv} added`, ...prev]);
//   };

//   // Run shortest path
//   const runShortestPath = (source, target) => {
//     const src = Number(source);
//     const dst = Number(target);
//     sendUpdate({ op: "shortest_path", u: src, v: dst });
//     setLogs(prev => [`Shortest path requested: ${src} → ${dst}`, ...prev]);
//   };

//   const runLouvain = (nodeIds) => {
//   sendUpdate({ op: "run_louvain", nodes: nodeIds });
//   setLogs(prev => [`Louvain run requested on nodes: ${nodeIds.join(", ")}`, ...prev]);
// };


//   return (
//     <div style={{ display: "flex", gap: "1rem", height: "100vh" }}>
//       <ControlPanel
//         nodes={nodes}
//         addNode={addNode}
//         addEdge={addEdge}
//         runShortestPath={runShortestPath}
//         runLouvain={runLouvain}
//       />
//       <GraphView nodes={nodes} edges={edges} />
//       <Sidebar logs={logs} />
//     </div>
//   );
// }

// export default App;


// src/App.jsx
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
    sendUpdate({ op: "add_edge", edge: edgeObj });
    setLogs((prev) => [`Edge ${uu} -> ${vv} added`, ...prev]);
  };

  // Run shortest path
  const runShortestPath = (source, target) => {
    sendUpdate({ op: "shortest_path", source: Number(source), target: Number(target) });
    setLogs((prev) => [`Shortest path requested: ${source} -> ${target}`, ...prev]);
  };

  // Run Louvain on all nodes or selected nodes
  const runLouvain = () => {
    const nodeIds = nodes.map((n) => n.id);
    sendUpdate({ op: "run_louvain", nodes: nodeIds });
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

