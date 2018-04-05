/* global d3 $ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
function BarChart() {
  let self = {
    chartMargins: {
      top: 10,
      right: 20,
      bottom: 25,
      left: 50
    },
    viewData: {
      barThickness: 100,
      textSize: 14
    },

    graph: null
  };

  function init(targetDiv) {
    let svg = targetDiv.append('svg');
    self.graph = svg.append('g').classed('graph-group', true);

    self.graph.background = self.graph.append('rect')
      .attr('x', self.chartMargins.left)
      .attr('y', self.chartMargins.top)
      .attr('width', $(svg.node()).width() - self.chartMargins.left - self.chartMargins.right)
      .attr('height', $(svg.node()).height() - self.chartMargins.top - self.chartMargins.bottom)
      .classed('graph-background', true).style('stroke', 'none');

    self.graph.content = self.graph.append('g').classed('graph-content', true);

    initializeViewData(self.graph);
  }

  function initializeViewData(graph) {
    self.viewData.boundsX = [0, +graph.background.attr('width')];
    self.viewData.boundsY = [+graph.background.attr('height'), 0];
    self.viewData.xOffset = +graph.background.attr('x');
    self.viewData.yOffset = +graph.background.attr('y');
  }

  /*
    data = [{
      value: <some value>,
      color: <some color>,
      name: <name of bar>,
      bounds: <selection bounds>
    }]
  */
  function update(data) {
    let xScale = d3.scaleLinear().domain([0, data.length]).range(self.viewData.boundsX);
    let yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range(self.viewData.boundsY);

    let yMax = yScale.domain()[1];
    let barWidth = xScale.range()[1] / data.length;

    self.graph.content.selectAll('*').remove();

    self.graph.content.selectAll('.bar').data(data)
      .enter().append('rect').each(function (data_entry, index) {
        let height = (data_entry.value !== 0) ? yScale(yMax - data_entry.value) : 0;
        let x = self.viewData.xOffset + xScale(index) + (barWidth - self.viewData.barThickness) / 2;
        // let y = self.viewData.yOffset + yScale(data_entry.value);

        let bar = d3.select(this).classed('bar', true)
          .attr('x', x).attr('y', self.viewData.yOffset + yScale(data_entry.value))
          .attr('width', self.viewData.barThickness).attr('height', height)
          .style('fill', data_entry.color).attr('id', 'selection-graph-bar');

        if(data_entry.bounds){
          bar.on('click', function () {
            App.views.map.centerAroundSelection(data_entry);
          });
        }

        let textOffsetY = self.viewData.boundsY[0] + self.viewData.yOffset * 1.5 + self.viewData.textSize * 1.15;
        let textOffsetX = (barWidth / 2);

        self.graph.content.append('text')
          .attr('x', self.viewData.xOffset + barWidth * index + textOffsetX).attr('y', textOffsetY)
          .attr('text-anchor', 'middle').style('font-size', self.viewData.textSize)
          .text(`${data_entry.name}`);
      });

    let yAxis = d3.axisLeft(yScale)
      .tickValues([yScale.domain()[0], (yScale.domain()[1] - yScale.domain()[0]) / 2, yScale.domain()[1]]);

    self.graph.content.append('g').classed('axis', true)
      .attr('transform', `translate(${self.viewData.xOffset},${self.viewData.yOffset})`).call(yAxis);

    let xAxis = d3.axisBottom(xScale).tickFormat(() => { return ''; }).ticks(1);

    self.graph.content.append('g').classed('axis', true)
      .attr('transform', `translate(${self.viewData.xOffset},${self.viewData.boundsY[0] + self.viewData.yOffset})`).call(xAxis);
  }

  return {
    init,
    update
  };
}
