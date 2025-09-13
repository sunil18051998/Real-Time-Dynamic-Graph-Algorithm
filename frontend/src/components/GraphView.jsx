// import React, { useEffect, useRef } from "react";
// import * as d3 from "d3";

// export default function GraphView({ nodes, edges }) {
//   const svgRef = useRef();

//   useEffect(() => {
//     const width = 800, height = 500;
//     const radius = 20;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll("*").remove();

//     const simulation = d3.forceSimulation(nodes)
//       .force("link", d3.forceLink(edges).id(d => d.id).distance(120))
//       .force("charge", d3.forceManyBody().strength(-200))
//       .force("center", d3.forceCenter(width / 2, height / 2));

//     // Edges
//     const link = svg.append("g")
//       .attr("stroke-width", 2)
//       .selectAll("line")
//       .data(edges, d => `${d.source}-${d.target}`)
//       .join(
//         enter => enter.append("line")
//           .attr("stroke", d => d.highlight ? "orange" : "#aaa")
//           .each(d => {
//             if (d.highlight) setTimeout(() => delete d.highlight, 1000);
//           }),
//         update => update
//           .attr("stroke", d => d.highlight ? "orange" : "#aaa")
//       );

//     // Nodes
//     const nodeGroup = svg.append("g")
//       .selectAll("g")
//       .data(nodes, d => d.id)
//       .join(
//         enter => {
//           const g = enter.append("g")
//             .call(d3.drag()
//               .on("start", (event, d) => {
//                 if (!event.active) simulation.alphaTarget(0.3).restart();
//                 d.fx = d.x;
//                 d.fy = d.y;
//               })
//               .on("drag", (event, d) => {
//                 d.fx = event.x;
//                 d.fy = event.y;
//               })
//               .on("end", (event, d) => {
//                 if (!event.active) simulation.alphaTarget(0);
//                 d.fx = null;
//                 d.fy = null;
//               })
//             );

//           g.append("circle")
//             .attr("r", radius)
//             .attr("fill", d => d.highlight ? "orange" : "steelblue")
//             .each(d => {
//               if (d.highlight) {
//                 // reset highlight after 1.5s
//                 setTimeout(() => {
//                   d.highlight = false;
//                   svg.selectAll("circle").filter(n => n.id === d.id)
//                     .transition().duration(500)
//                     .attr("fill", "steelblue");
//                 }, 1500);
//               }
//             });

//           g.append("text")
//             .text(d => d.id)
//             .attr("text-anchor", "middle")
//             .attr("dy", "0.35em")
//             .attr("fill", "white")
//             .style("font-size", "12px")
//             .style("pointer-events", "none");

//           return g;
//         },
//         update => update
//       );

//     simulation.on("tick", () => {
//       link
//         .attr("x1", d => d.source.x)
//         .attr("y1", d => d.source.y)
//         .attr("x2", d => d.target.x)
//         .attr("y2", d => d.target.y);

//       nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
//     });

//     simulation.alphaTarget(0.25).restart();
//     setTimeout(() => simulation.alphaTarget(0), 3000);
//   }, [nodes, edges]);

//   return <svg ref={svgRef} width={800} height={500} style={{ border: "1px solid #ccc" }} />;
// }


// src/components/GraphView.jsx
import React from "react";

export default function GraphView({ nodes, edges }) {
  const width = 800;
  const height = 600;

  // Assign colors to communities
  const communityColors = [
    "#f87171", "#60a5fa", "#34d399", "#facc15", "#a78bfa",
    "#fb923c", "#818cf8", "#22d3ee", "#a3e635", "#f472b6"
  ];

  const getNodeColor = (community) =>
    communityColors[community % communityColors.length] || "#d1d5db";

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
            cx={node.x}
            cy={node.y}
            r={20}
            fill={getNodeColor(node.community ?? 0)}
            stroke={node.highlight ? "#000" : "#6b7280"}
            strokeWidth={2}
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
