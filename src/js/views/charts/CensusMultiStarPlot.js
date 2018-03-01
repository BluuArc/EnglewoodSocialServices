"use strict";

// shows distribution of given categories of a given selection
function CensusMultiStarPlot(id, title, options = {}) {
  let self = {
    title: title,
    id: id,
    englewoodStarPlot: null,
    westEnglewoodStarPlot: null,
    axes: options.axes || []
  };

  function init(chartPanel) {
    self.westEnglewoodStarPlot = new StarPlotView({
      parent: chartPanel.select(".panel-body").append('div').classed('west-englewood', true),
      name: id,
      width: '100%',
      height: '300px',
      margin: {
        top: 50,
        left: 75
      },
      axes: self.axes,
      rotate: 0,
      interaction: false,
      labels: options.labels
    });

    self.englewoodStarPlot = new StarPlotView({
      parent: chartPanel.select(".panel-body").append('div').classed('englewood', true),
      name: id,
      width: '100%',
      height: '300px',
      margin: {
        top: 50,
        left: 75
      },
      axes: self.axes,
      rotate: 0,
      interaction: false,
      labels: options.labels
    });

    if (options.init) {
      options.init(chartPanel);
    }
  }

  function update(panel, data, options = { renderLabels: false, enableInteraction: false }) {
    if (data) {
      panel.style("display", null);
      console.debug(options.fillColor);
      if(options.groupID === 'englewood'){
        self.englewoodStarPlot.render(data, options.groupID, options.fillColor);
      }else if(options.groupID === 'westEnglewood'){
        self.westEnglewoodStarPlot.render(data, options.groupID, options.fillColor);
      }else if(options.groupID === 'chart-outline' || options.renderLabels === true) { //render backgrounds only
        self.englewoodStarPlot.render(data, options.groupID, options.fillColor);
        self.westEnglewoodStarPlot.render(data, options.groupID, options.fillColor);
      }else{
        throw Error("Must specify valid group ID");
      }
    } else {
      panel.style("display", "none"); // hide on no data
    }
  }

  function remove(skipReset) {
    console.debug("Removing census kiviat chart for", self.title);
    if (!skipReset) {
      App.controllers.mapData.resetFilters(true);
    }
  }

  return {
    title: self.title,
    id: self.id,
    init,
    update,
    remove
  };
}
