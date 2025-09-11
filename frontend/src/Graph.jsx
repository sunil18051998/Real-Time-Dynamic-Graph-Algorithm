import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const GraphView = ({ nodes, edges }) => {
  const ref = useRef();
  const simulationRef = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);

    // Initialize SVG only once
    if (!simulationRef.current) {
      svg.append("g").attr("class", "links");
      svg.append("g").attr("class", "nodes");

      simulationRef.current = d3.forceSimulation()
        .force("link", d3.forceLink().id((d) => d.id).distance(50))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(250, 250));
    }

    const simulation = simulationRef.current;

    // Bind edges
    const link = svg.select(".links")
      .selectAll("line")
      .data(edges, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

    link.exit().remove();
    link.enter()
      .append("line")
      .style("stroke", "#aaa");

    // Bind nodes
    const node = svg.select(".nodes")
      .selectAll("circle")
      .data(nodes, d => d.id);

    node.exit().remove();
    node.enter()
      .append("circle")
      .attr("r", 8)
      .style("fill", "steelblue")
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
        }));

    // Update simulation with latest data
    simulation.nodes(nodes).on("tick", () => {
      svg.selectAll("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      svg.selectAll("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    });

    simulation.force("link").links(edges);
    simulation.alpha(0.5).restart();

  }, [nodes, edges]);

  return <svg ref={ref} width="500" height="500"></svg>;
};

export default GraphView;
