"use strict";

// shows distribution of given categories of a given selection
function CensusStarPlot(id, title, options = {}) {
  let self = {
    title: title,
    id: id,
    starPlot: null,
    axes: options.axes || []
  };
  let publicFunctions = {
    title: self.title,
    id: self.id,
    init,
    update,
  };

  function init(chartPanel) {
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
      interaction: true
    });

    publicFunctions.raiseGroup = self.starPlot.raiseGroup;

    if(options.init){
      options.init(chartPanel);
    }
  }

  function update(panel, data, options = { renderLabels: false, enableInteraction: false}) {
    if (data) {
      panel.style("display", null);
      console.log(options.fillColor);
      self.starPlot.render(data, options.groupID, options.fillColor);


      if (options.renderLabels) {
        // offsetLabels(panel);
        // addLotMarkers(panel);
      }

      if (options.enableInteraction) {
        options.interactionFn ? options.interactionFn(panel, self.propertyMap) : addInteraction(panel, options);
      }
    } else {
      panel.style("display", "none"); // hide on no data
    }
  }

  // based off of http://bl.ocks.org/kevinschaul/8833989
  function addInteraction(panel, interactionOptions) {
    console.error("Need to implement interaction in CensusStarPlot");
    return;
    
    let svg = panel.select('.panel-body svg');
    let footer = panel.select('.panel-footer');

    let defaultText = "Click on the chart to view data";

    let dataText = footer.append("div").attr("class", "data-text")
      .text(defaultText).classed("empty", true);

    let interactionObjects = panel.selectAll(".interaction").style('display', 'none');

    let selectionKey = null,
      selectionElem = null;

    svg.selectAll(".star-interaction")
      .classed('hoverable', true)
      .on('mouseover', (d) => {
        interactionObjects.style('display', 'block');
      }).on('mouseout', (d) => {
        interactionObjects.style('display', 'none');
      }).on('click', function (d) {
        let elem = d3.select(this);

        if (selectionElem) {
          selectionElem.style("stroke-width", null)
            .style("fill-opacity", null);
        }

        if (selectionKey !== d.key) {
          let percent = (d.datum[d.key] / dataRanges[d.key][1]) * 100;

          let htmlText = interactionOptions.htmlFn ? interactionOptions.htmlFn(d, self.propertyMap) : `<b>${self.propertyMap[d.key]}:</b><br>${d.datum[d.key]} (${percent.toFixed(2)}%) of ${dataRanges[d.key][1]} total lots`;
          dataText.html(htmlText)
            .classed("empty", false);

          selectionElem = elem.style("stroke-width", "2px").style("fill-opacity", "0.4");
          selectionKey = d.key;
        } else {
          selectionKey = null;
          selectionElem = null;
          dataText.text(defaultText).classed("empty", true);
        }
      });
  }

  return publicFunctions;
}
