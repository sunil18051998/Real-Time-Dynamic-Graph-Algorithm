import React, { useState, useEffect } from "react";

export default function Sidebar({ nodes, edges, addLog, runShortestPath, runLouvain, resetGraph }) {
  const [logs, setLogs] = useState([]);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (addLog) {
      setLogs(prev => [addLog, ...prev].slice(0, 10));
    }
  }, [addLog]);

  const handleRunShortestPath = () => {
    if (!source || !target) return;
    runShortestPath(Number(source), Number(target));
  };

  const averageDegree = nodes.length ? (edges.length / nodes.length).toFixed(2) : 0;

  return (
    <div className="w-64 p-4 bg-gray-50 border-l border-gray-300 flex flex-col gap-4 h-full">
      <div>
        <h3 className="font-semibold text-lg mb-2">Graph Info</h3>
        <p>Total Nodes: <strong>{nodes.length}</strong></p>
        <p>Total Edges: <strong>{edges.length}</strong></p>
        <p>Avg Degree: <strong>{averageDegree}</strong></p>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">Recent Updates</h3>
        <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
          {logs.map((log, idx) => <li key={idx} className="text-sm text-gray-700">{log}</li>)}
        </ul>
      </div>

      {/* Shortest Path Controls */}
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-lg mb-1">Shortest Path</h3>
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Source</option>
          {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
        </select>
        <select
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Target</option>
          {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
        </select>
        <button
          className="bg-orange-500 text-white py-1 rounded"
          onClick={handleRunShortestPath}
        >
          Run Shortest Path
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <h3 className="font-semibold text-lg mb-1">Algorithms</h3>
        <button className="bg-green-600 text-white py-1 rounded" onClick={runLouvain}>
          Run Louvain
        </button>
        <button className="bg-red-600 text-white py-1 rounded" onClick={resetGraph}>
          Reset Graph
        </button>
      </div>
    </div>
  );
}
