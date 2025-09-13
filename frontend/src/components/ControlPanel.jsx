import { useState } from "react";

export default function ControlPanel({ nodes, addNode, addEdge, runLouvain }) {
  const [nodeId, setNodeId] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");

  const handleAddNode = () => {
    const idNum = Number(nodeId);
    if (Number.isNaN(idNum)) {
      setError("Node ID must be a number");
      return;
    }
    if (nodes.some(n => n.id === idNum)) {
      setError("Node ID already exists");
      return;
    }
    addNode(idNum);
    setNodeId("");
    setError("");
  };

  const handleAddEdge = () => {
    const u = Number(source);
    const v = Number(target);
    if (Number.isNaN(u) || Number.isNaN(v)) {
      setError("Source and Target must be numbers");
      return;
    }
    if (!nodes.find(n => n.id === u) || !nodes.find(n => n.id === v)) {
      setError("Both nodes must exist to add an edge");
      return;
    }
    if (u === v) {
      setError("Cannot create self-loop");
      return;
    }
    addEdge(u, v);
    setSource("");
    setTarget("");
    setError("");
  };

  return (
    <div className="p-4 bg-white rounded shadow-md space-y-3">
      <h2 className="font-semibold text-lg">Controls</h2>

      {/* Add Node */}
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Node ID"
          value={nodeId}
          onChange={e => setNodeId(e.target.value)}
          className="border rounded px-2 py-1 w-20"
        />
        <button
          onClick={handleAddNode}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Add Node
        </button>
      </div>

      {/* Add Edge */}
      <div className="flex gap-2 mt-2">
        <input
          type="number"
          placeholder="Source"
          value={source}
          onChange={e => setSource(e.target.value)}
          className="border rounded px-2 py-1 w-20"
        />
        <input
          type="number"
          placeholder="Target"
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="border rounded px-2 py-1 w-20"
        />
        <button
          onClick={handleAddEdge}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Add Edge
        </button>
      </div>
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        onClick={() => {
          const nodeIds = nodes.map(n => n.id);
          runLouvain(nodeIds);
        }}
      >
        Run Louvain
      </button>


      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm mt-1">{error}</div>
      )}
    </div>
  );
}
