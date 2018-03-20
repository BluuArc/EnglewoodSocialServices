"use strict";

var App = App || {};

/* global d3 $ */
const MapLegendView = function (initOptions = {}) {
  const self = {
    id: null,
    parent: null,
    svg: null,
    columnWidth: 175,
    leftMargin: 25,
    topMargin: 20,
    mapColorCodes: null,
  };

  init();
  function init() {
    self.id = initOptions.id || '#svgLegend';
    self.parent = initOptions.parent;
    self.mapColorCodes = d3.scaleOrdinal()
      .domain(["West Englewood", "Englewood"])
      .range(["#1f77b4", "#ff7f0e"]);
  }

  function drawSVG(options) {
    if (self.svg) {
      self.svg.remove();
    }

    if (!self.parent.select(self.id).empty()) {
      self.parent.select(self.id).remove();
    }

    const svg = self.parent.append('svg')
      .attr('width', self.columnWidth * 3).attr('height', 150)
      .style('background-color', 'rgba(150,150,150,0.75)')
      .attr('id', self.id);

    const [leftGroup, middleGroup, rightGroup] = [
      drawLeftColumn(svg),
      drawMiddleColumn(svg, options),
      drawRightColumn(svg),
    ];

    const height = Math.max(
      leftGroup.node().getBBox().height,
      middleGroup.node().getBBox().height,
      rightGroup.node().getBBox().height
    );

    svg.attr('height', height * 1.15);

    self.svg = svg;
  }

  function drawLeftColumn(svg) {
    const leftGroup = svg.append('g')
      .attr('class', 'legendOrdinal')
      .attr('id', 'left-column')
      .attr('transform', `translate(${self.leftMargin},${self.topMargin})`);

    const neighborhoodLegend = d3.legendColor()
      .shapeWidth(30)
      .title('Neighborhood')
      .titleWidth(120)
      .scale(self.mapColorCodes);

    leftGroup.call(neighborhoodLegend);

    svg.select('.legendTitle')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(62.5,5)');

    const markerLegendGroup = leftGroup.append('g')
      .attr('transform', `translate(0,${leftGroup.node().getBBox().height + self.topMargin})`);

    const markerLabels = [
      {
        id: 'serviceMarker',
        name: 'Service Marker'
      },
      {
        id: 'lotMarker',
        name: 'Lot Marker'
      },
      {
        id: 'schoolMarker',
        name: 'School Marker'
      }
    ];

    markerLegendGroup.append('text')
      .classed('.legendTitle', true)
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(62.5,0)')
      .text('Markers');

    const lineHeight = 25;
    const markerHeight = 25;
    const topMarkerOffset = markerHeight * 0.5;
    const topLabelOffset = 20 * 1.25;
    markerLabels.map((label, index) => {
      const icon = App.views.map.getSmallIcon(label.id);
      markerLegendGroup.append('svg')
        .html(d3.select($(icon.options.html).get(0)).html())
        .attr('x', 7.5).attr('y', topMarkerOffset + markerHeight * (index));

      markerLegendGroup.append('text')
        .text(label.name).classed('label', true)
        .attr('transform', `translate(40, ${topLabelOffset + lineHeight*(index)})`);
    });
    return leftGroup;
  }

  function drawRightColumn(svg) {
    const rightGroup = svg.append("g")
      .attr("id", "right-column")
      .attr("transform", `translate(${2 * self.columnWidth},${self.topMargin})`);

    rightGroup.append('text')
      .text('lot marker legend here');

    return rightGroup;
  }

  function drawMiddleColumn(svg, censusOptions) {
    // let backgroundHeight = +leftGroup.node().getBBox().height * 1.4;
    const censusGroup = svg.append("g")
      .attr("id", "middle-column")
      .attr("class", "legendLinear")
      .attr("transform", `translate(${self.columnWidth},${self.topMargin})`);
    if (censusOptions) {
      // const censusGroup = svg.append("g")
      //   .attr("class", "legendLinear")
      //   .attr("transform", `translate(${leftMargin + columnWidth},${topMargin})`)
      //   .attr("transform", `translate(${leftMargin + columnWidth},${30 + +group.node().getBBox().height})`);

      const legendLinear = d3.legendColor()
        .shapeWidth(30)
        .labelFormat(d3.format(".0f"))
        .title(`${_.startCase(censusOptions.title)}\n(Block Level)`)
        .titleWidth(120)
        .scale(censusOptions.colorScale);

      censusGroup.call(legendLinear);

      censusGroup.select(".legendTitle")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(62.5,5)");

      censusGroup.selectAll('.legendCells text.label')
        .each(function () {
          const elem = d3.select(this);
          elem.text(elem.text() + " people");
        });

      // backgroundHeight += +censusGroup.node().getBBox().height;
    } else {
      censusGroup.append('text')
        .text('Select a census category')
        // .attr('transform', `translate(0, ${backgroundHeight * 0.25})`);
    }

    return censusGroup;
  }

  function getSVG() {
    return self.svg;
  }

  return {
    getSVG,
    drawSVG
  };
};
