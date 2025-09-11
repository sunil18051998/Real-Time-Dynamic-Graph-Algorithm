import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function GraphView({ nodes, edges }) {
  const svgRef = useRef();

  useEffect(() => {
    const width = 800, height = 500;
    const radius = 20;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Edges
    const link = svg.append("g")
      .attr("stroke-width", 2)
      .selectAll("line")
      .data(edges, d => `${d.source}-${d.target}`)
      .join(
        enter => enter.append("line")
          .attr("stroke", d => d.highlight ? "orange" : "#aaa")
          .each(d => {
            if (d.highlight) setTimeout(() => delete d.highlight, 1000);
          }),
        update => update
          .attr("stroke", d => d.highlight ? "orange" : "#aaa")
      );

    // Nodes
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes, d => d.id)
      .join(
        enter => {
          const g = enter.append("g")
            .call(d3.drag()
              .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
              })
              .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
              })
              .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              })
            );

          g.append("circle")
            .attr("r", radius)
            .attr("fill", d => d.highlight ? "orange" : "steelblue")
            .each(d => {
              if (d.highlight) {
                // reset highlight after 1.5s
                setTimeout(() => {
                  d.highlight = false;
                  svg.selectAll("circle").filter(n => n.id === d.id)
                    .transition().duration(500)
                    .attr("fill", "steelblue");
                }, 1500);
              }
            });

          g.append("text")
            .text(d => d.id)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "white")
            .style("font-size", "12px")
            .style("pointer-events", "none");

          return g;
        },
        update => update
      );

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    simulation.alphaTarget(0.25).restart();
    setTimeout(() => simulation.alphaTarget(0), 3000);
  }, [nodes, edges]);

  return <svg ref={svgRef} width={800} height={500} style={{ border: "1px solid #ccc" }} />;
}
