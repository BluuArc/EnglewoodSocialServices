"use strict";

var App = App || {};

function PixelGlyph(options) {
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
    nameMapping: {

    },
    quadrants: {},
    graph: null
  };

  function init(targetDiv) {
    let svg = targetDiv.select(".panel-body").append("svg");
    self.graph = svg.append('g').classed('graph-group', true);

    let size = $(svg.node()).width() - self.chartMargins.left - self.chartMargins.right;
    svg.style("height", size + self.chartMargins.top + self.chartMargins.bottom);

    self.graph.content = self.graph.append("g").classed("graph-content", true);

    self.graph.background = self.graph.append("rect")
      .attr("x", self.chartMargins.left)
      .attr("y", self.chartMargins.top)
      .attr("width", size).attr("height", size)
      .classed('graph-background', true)
      .attr('stroke', self.colors.outline).attr("stroke-width", "1px");

    self.graph.layout = self.graph.append('g').classed('graph-layout', true);

    self.size = size;

    initializeQuadrants();
    initializeLayout();
  }

  function initializeQuadrants() {
    const quadrants = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

    // quadrant data includes: color, maxValue, name
    quadrants.forEach((q,i) => { 
      self.quadrants[q] = options.quadrants[q];

      self.nameMapping[self.quadrants[q].name] = q;

      self.quadrants[q].rectangle = self.graph.content.append('rect')
        .attr('width', self.size / 2).attr('height', self.size / 2)
        .attr('x', self.chartMargins.left + ((i % 2 == 0) ? 0 : (self.size / 2)))
        .attr('y', self.chartMargins.top + ((i < 2) ? 0 : (self.size / 2)))
        .style('fill', self.quadrants[q].color).attr('id', q)
        .attr('stroke', 'none');

      self.quadrants[q].scale = d3.scaleLinear().domain([0, self.quadrants[q].maxValue]).range([0,1]);
    });
  }

  function getQuadrant(name) {
    return self.nameMapping[name];
  }

  function getQuadrantName(quadrant) {
    return self.quadrants[quadrant].name;
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
      .attr('stroke', self.colors.outline).attr("stroke-width", "3px");
    self.graph.layout.append('path').datum(horizontalAxis).attr("d", line)
      .attr('stroke', self.colors.outline).attr("stroke-width", "3px");
  }

  /*
    data = {
      <name for top left quadrant>: value, // name being something like "Residential", NOT "topLeft"
      <name for top right quadrant>: value, // ordering of data doesn't matter
    }
  */
  function update(panel, data) {
    Object.keys(self.quadrants).forEach(q => {
      console.log(data[getQuadrantName(q)], self.quadrants[q].scale(data[getQuadrantName(q)]));
      self.quadrants[q].rectangle
        .style('opacity', self.quadrants[q].scale(data[getQuadrantName(q)]));
    });
  }

  return {
    init,
    update
  };
}
