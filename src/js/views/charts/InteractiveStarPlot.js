"use strict";

// shows distribution of given categories of a given selection
function InteractiveStarPlot(id, title, options = {}) {
  let self = {
    title: title,
    id: id,
    starPlot: null,
    axes: options.axes || []
  };

  function init(chartPanel) {
    self.starPlot = new StarPlotView({
      parent: chartPanel.select(".panel-body"),
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
      if (options.groupID === 'chart-outline' || options.renderLabels === true) { //render backgrounds only
        self.starPlot.render(data, 'chart-outline', options.fillColor);
      } else {
        self.starPlot.render(data, 'glyph', options.fillColor)
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
