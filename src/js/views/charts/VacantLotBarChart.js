"use strict";

var App = App || {};

// bar chart that compares number of vacant lots between West Englewood and Englewood
function VacantLotBarChart(englewoodData, westEnglewoodData, id) {
  let self = {
    title: "<h4><b>Vacant Lots</b></h4>",
    id: id || "vacant-lots-total",
    barChart: null,
    selections: [westEnglewoodData, englewoodData],
  };

  function init(chartPanel) {
    self.barChart = new BarChart();

    self.barChart.init(chartPanel.select(".panel-body"));
  }

  function update() {
    let data = self.selections.map(selection => {
          return {
            value: selection.data.lot.length,
            color: selection.color,
            name: selection.id,
            bounds: selection.bounds
          };
      });

    self.barChart.update(data);
  }

  return {
    title: self.title,
    id: self.id,
    init,
    update
  };
}