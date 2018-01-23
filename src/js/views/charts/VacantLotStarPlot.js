"use strict";

// star plot that shows the distribution of vacant lot types of a given selection
function VacantLotStarPlot(id, title, dataRanges) {
  let self = {
    title: title,
    id: id,
    starPlot: null,
    // zone names referenced from https://secondcityzoning.org/zones/
    axes: [
      {
        propertyName: "Residential",
        min: dataRanges.Residential[0],
        max: dataRanges.Residential[1],
      },
      {
        propertyName: "BCM",
        label: ["Business, Commercial,", "and Manufacturing"],
        min: dataRanges.BCM[0],
        max: dataRanges.BCM[1],
      },
      {
        propertyName: "POS",
        label: ["Parks and", "Open Space"],
        min: dataRanges.POS[0],
        max: dataRanges.POS[1],
      },
      {
        propertyName: "PD",
        label: ["Planned Manufacturing", "Districts and Development"],
        min: dataRanges.PD[0],
        max: dataRanges.PD[1],
      },
    ],
    propertyMap: {
      Residential: 'Residential',
      BCM: "Business, Commercial, Manufacturing",
      POS: "Parks and Open Space",
      PD: "Planned Manufacturing Districts and Development"
    }
  };

  function init(chartPanel) {
    console.log(self.axes);
    self.starPlot = new StarPlotView({
      parent: chartPanel.select(".panel-body"),
      name: id,
      width: '100%',
      height: '300px',
      margin: {
        top: 50,
        left: 90
      },
      axes: self.axes,
      rotate: 0,
      // interaction: true
    });
  }

  function update(panel, data) {
    if (data) {
      panel.style("display", null);
      self.starPlot.render(data);

      // offset side labels to not cover chart
      let residentialLabel = panel.select("text#Residential"),
        parkLabel = panel.select("text#POS");
      residentialLabel.attr('x', +residentialLabel.attr('x') + 10);
      parkLabel.selectAll('tspan').attr('x', +parkLabel.attr('x') - 10);
    } else {
      panel.style("display", "none"); // hide on no data
    }
  }

  return {
    title: self.title,
    id: self.id,
    init,
    update
  }
}