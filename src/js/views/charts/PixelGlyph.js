"use strict";

var App = App || {};

function PixelGlyph() {
  let self = {
    chartMargins: {
      top: 30,
      bottom: 30,
      left: 50,
      right: 50
    },
    colors: {
      outline: "black"
    },
    graph: null
  };

  function init(targetDiv) {
    let svg = targetDiv.select(".panel-body").append("svg");
    self.graph = svg.append('g').classed('graph-group', true);

    let size = $(svg.node()).width() - self.chartMargins.left - self.chartMargins.right;
    svg.style("height", size + self.chartMargins.top + self.chartMargins.bottom);

    self.graph.background = self.graph.append("rect")
      .attr("x", self.chartMargins.left)
      .attr("y", self.chartMargins.top)
      .attr("width", size).attr("height", size)
      .classed('graph-background', true)
      .attr('stroke', self.colors.outline).attr("stroke-width", "1px");

    self.size = size;

    self.graph.layout = self.graph.append('g').classed('graph-layout', true);
    self.graph.content = self.graph.append("g").classed("graph-content", true);

    initializeLayout();
  }

  function initializeLayout() {
    let line = d3.line()
      .x(d => d[0]).y(d => d[1]);
      
    let verticalAxis = [
      [self.chartMargins.left + self.size / 2, self.chartMargins.top],
      [self.chartMargins.left + self.size / 2, self.chartMargins.top + self.size]
    ];

    let horizontalAxis = [
      [self.chartMargins.left, self.chartMargins.top + self.size / 2],
      [self.chartMargins.left + self.size, self.chartMargins.top + self.size / 2],
    ];
    self.graph.layout.append('path').datum(verticalAxis).attr("d", line)
      .attr('stroke', self.colors.outline).attr("stroke-width", "1px");
    self.graph.layout.append('path').datum(horizontalAxis).attr("d", line)
      .attr('stroke', self.colors.outline).attr("stroke-width", "1px");
  }

  function update() {
    
  }

  return {
    init,
    update
  };
}
