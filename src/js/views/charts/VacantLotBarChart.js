"use strict";

var App = App || {};

// bar chart that compares number of vacant lots between West Englewood and Englewood
let VacantLotBarChart = function (englewoodData, westEnglewoodData, id) {
  let self = {
    title: "<h4><b>Vacant Lots</b></h4>",
    id: id || "vacant-lots-total",
    graph: null,

    chartMargins: {
      top: 10,
      right: 20,
      bottom: 25,
      left: 50
    },
    barThickness: 100,
    selections: [westEnglewoodData, englewoodData],
    viewData: {
      
    }
  };

  function init(chartPanel) {
    let svg = chartPanel.select(".panel-body").append("svg");
    self.graph = svg.append('g').classed('graph-group',true);

    console.log("height",$(svg.node()).height())

    self.graph.background = self.graph.append("rect")
      .attr("x", self.chartMargins.left)
      .attr("y", self.chartMargins.top)
      .attr("width", $(svg.node()).width() - self.chartMargins.left - self.chartMargins.right)
      .attr("height", $(svg.node()).height() - self.chartMargins.top - self.chartMargins.bottom)
      .classed('graph-background', true).style('stroke', 'none');

    self.graph.content = self.graph.append("g").classed("graph-content", true);
  }

  function update() {
    self.graph.content.selectAll("*").remove();

    let data = self.selections.map(selection => {
          return {
            value: selection.data.lot.length,
            color: selection.color
          };
      });

    drawGraphBars(self.graph, data);
  }

  function drawGraphBars(graph,data) {
    let boundsX = [0, +graph.background.attr('width')];
    let xScale = d3.scaleLinear().domain([0, self.selections.length]).range(boundsX);

    let barThickness = self.barThickness;
    let barWidth = xScale.range()[1] / self.selections.length;
    let boundsY = [+graph.background.attr('height'), 0];
    let yScale = d3.scaleLinear().domain([0, d3.max(data, (d) => { return d.value; })]).range(boundsY);
    let xOffset = +graph.background.attr('x'), yOffset = +graph.background.attr('y');
    let yMax = yScale.domain()[1];

    graph.content.selectAll('.bar').data(data)
      .enter().append('rect').each(function (data_entry, index) {
        let height = (data_entry.value != 0) ? yScale(yMax - data_entry.value) : 0;
        let x = xOffset + xScale(index) + (barWidth - barThickness) / 2, y = yOffset + yScale(data_entry.value);
        d3.select(this).classed('bar', true)
          .attr('x', x).attr('y', yOffset + yScale(data_entry.value))
          .attr('width', barThickness).attr('height', height)
          .style('fill', data_entry.color).attr('id', 'selection-graph-bar')
          .on('click', function () {
            App.views.map.centerAroundSelection(self.selections[index]);
          });

        let textSize = 14;
        let textOffsetY = boundsY[0] + yOffset * 1.5 + textSize * 1.15;
        let textOffsetX = (barWidth / 2);

        graph.content.append('text')
          .attr('x', xOffset + barWidth * index + textOffsetX).attr('y', textOffsetY)
          .attr('text-anchor', 'middle').style('font-size', textSize)
          .text(`${self.selections[index].id}`);
      });

    let yAxis = d3.axisLeft(yScale)
      .tickValues([yScale.domain()[0], (yScale.domain()[1] - yScale.domain()[0]) / 2, yScale.domain()[1]]);

    graph.content.append('g').classed('axis', true)
      .attr('transform', `translate(${xOffset},${yOffset})`).call(yAxis);

    let xAxis = d3.axisBottom(xScale).tickFormat(() => { return ""; }).ticks(1);

    graph.content.append('g').classed('axis', true)
      .attr('transform', `translate(${xOffset},${boundsY[0] + yOffset})`).call(xAxis);
  }

  return {
    title: self.title,
    id: self.id,
    init,
    update
  };
}