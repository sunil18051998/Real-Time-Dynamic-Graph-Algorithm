
import React from "react";

export default function GraphView({ nodes, edges }) {
  const width = 800;
  const height = 600;

  // Assign colors to communities
  const communityColors = [
    "#f87171", "#60a5fa", "#34d399", "#facc15", "#a78bfa",
    "#fb923c", "#818cf8", "#22d3ee", "#a3e635", "#f472b6"
  ];

  const getNodeColor = (community) => {
    if (community === undefined) return "#888"; // default
    const palette = ["#ff6b6b", "#6bcB77", "#4d96ff", "#ffd93d", "#d65db1"];
    return palette[community % palette.length];
  };

  // inside render



  return (
    <svg width={width} height={height} style={{ border: "1px solid #ccc" }}>
      {/* Draw edges */}
      {edges.map((edge, idx) => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return null;

        return (
          <line
            key={idx}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={edge.highlight ? "#f59e0b" : "#9ca3af"}
            strokeWidth={edge.highlight ? 3 : 1.5}
          />
        );
      })}

      {/* Draw nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={10}
            fill={getNodeColor(node.community)}
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="white"
            style={{ pointerEvents: "none" }}
          >
            {node.label ?? node.id}
          </text>
        </g>
      ))}
    </svg>
  );
}
