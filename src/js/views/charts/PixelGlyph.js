/* global $ d3 */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
function PixelGlyph(options) {
  let self = {
    chartMargins: {
      top: 10,
      bottom: 10,
      left: 50,
      right: 50
    },
    colors: {
      outline: 'black'
    },
    nameMapping: {

    },
    quadrants: {},
    graph: null
  };

  function init(targetDiv) {
    let svg = targetDiv.append('svg');
    self.graph = svg.append('g').classed('graph-group', true);

    self.chartMargins = options.chartMargins || self.chartMargins;

    // overall glyph size
    let size = $(svg.node()).width() - self.chartMargins.left - self.chartMargins.right;
    svg.style('height', `${size + self.chartMargins.top + self.chartMargins.bottom}px`);

    if (options.width) {
      svg.style('width', options.width);
    }

    self.graph.content = self.graph.append('g').classed('graph-content', true);

    self.graph.background = self.graph.append('rect')
      .attr('x', self.chartMargins.left)
      .attr('y', self.chartMargins.top)
      .attr('width', size).attr('height', size)
      .classed('graph-background', true)
      .attr('fill', 'none')
      .attr('stroke', self.colors.outline).attr('stroke-width', '1px');

    self.graph.layout = self.graph.append('g').classed('graph-layout', true);

    self.size = size;

    initializeQuadrants();
    initializeLayout();
  }

  function initializeQuadrants() {
    const quadrants = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
    const padding = 6.5;

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

      self.graph.content.append('rect')
        .attr('width', +self.quadrants[q].rectangle.attr('width') - padding)
        .attr('height', +self.quadrants[q].rectangle.attr('height') - padding)
        .attr('x', +self.quadrants[q].rectangle.attr('x') + padding/2)
        .attr('y', +self.quadrants[q].rectangle.attr('y') + padding/2)
        .style('fill', 'none').style('stroke', self.quadrants[q].color)
        .style('stroke-width', padding);

      self.quadrants[q].scale = d3.scaleLinear().domain([0, self.quadrants[q].maxValue]).range([0,1]);
    });
    
  }

  // eslint-disable-next-line no-unused-vars
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
    self.graph.layout.append('path').datum(verticalAxis).attr('d', line)
      .attr('stroke', self.colors.outline).attr('stroke-width', '3px');
    self.graph.layout.append('path').datum(horizontalAxis).attr('d', line)
      .attr('stroke', self.colors.outline).attr('stroke-width', '3px');

    drawLabels(false);
  }

  // based off of http://bl.ocks.org/nitaku/8745933
  function addBorderAroundLabel(d3Label, targetGroup, color) {
    let bBox = d3Label.node().getBBox();
    let ctm = d3Label.node().getCTM();

    let setTransform = (element, matrix) => element.transform.baseVal.initialize(element.ownerSVGElement.createSVGTransformFromMatrix(matrix));

    const padding = 2;
    let borderRect = targetGroup.insert('rect','text')
      .attr('x', bBox.x - padding/2).attr('y', bBox.y - padding/2)
      .attr('width', bBox.width + padding).attr('height', bBox.height + padding)
      .style('stroke', color).style('stroke-width', '2px');
      
    setTransform(borderRect.node(),ctm);
  }

  function drawLabels(doAddBorder) {
    let labelGroup = self.graph.layout.append('g').attr('id', 'label-group');
    Object.keys(self.quadrants).forEach((q,i) => {
      let quadrant = self.quadrants[q];
      let topLeftCoords = [
        self.chartMargins.left + ((i % 2 == 0) ? 0 : (self.size / 2)),
        self.chartMargins.top + ((i < 2) ? 0 : (self.size / 2))
      ];

      let label = labelGroup.append('text')
        .attr('x', topLeftCoords[0] + self.size / 4)
        .attr('y', topLeftCoords[1] + self.size / 4)
        .style('text-anchor', 'middle').style('dominant-baseline', 'central')
        .attr('id', quadrant.name);
      
      if(quadrant.graphLabel){
        quadrant.graphLabel.forEach((d,i) => {
          label.append('tspan')
            .attr('x', label.attr('x')).attr('dy', i == 0 ? `-${quadrant.graphLabel.length/2}em` : '1.2em')
            .text(d);
        });
      }else{
        label.text(quadrant.name);
      }

      if(doAddBorder){
        addBorderAroundLabel(label, labelGroup, quadrant.color);
      }
    });
  }

  /*
    data = {
      <name for top left quadrant>: value, // name being something like "Residential", NOT "topLeft"
      <name for top right quadrant>: value, // ordering of data doesn't matter
    }
  */
  function update(panel, data) {
    Object.keys(self.quadrants).forEach(q => {
      self.quadrants[q].rectangle
        .style('opacity', self.quadrants[q].scale(data[getQuadrantName(q)]));
    });
  }

  return {
    init,
    update
  };
}
