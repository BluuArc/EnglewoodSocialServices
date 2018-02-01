"use strict";

// star plot that shows the distribution of vacant lot types of a given selection
function VacantLotStarPlot(id, title, dataRanges, options = {}) {
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
      interaction: true
    });

    if(options.init){
      options.init(chartPanel);
    }
  }

  // add lot markers to graph
  function addLotMarkers(panel) {
    let svg = panel.select('svg');
    let offsets = {
      Residential: { x: 77.5, y: 60 },
      BCM: { x: 0, y: 25 },
      POS: { x: 65, y: 60 },
      PD: { x: 0, y: 25 },
    }

    svg.selectAll('text.star-label')
      .each(function(){
        let elem = $(this);

        if (!offsets[elem.attr("id")]){
          return;
        }
        let icon = $(App.views.map.getIcon(elem.attr("id")).options.html)
          .attr("id", elem.attr("id")).addClass("star-symbol")
          .get(0);

        svg.append(() => icon)
          .attr('x', +elem.attr("x") + offsets[elem.attr("id")].x)
          .attr('y', +elem.attr("y") + offsets[elem.attr("id")].y);
        
      });
  }

  function update(panel, data, options = {renderLabels: false, enableInteraction: false} ) {
    if (data) {
      panel.style("display", null);
      console.log(options.fillColor);
      self.starPlot.render(data, options.groupID, options.fillColor);


      if(options.renderLabels){
        offsetLabels(panel);
        addLotMarkers(panel);
      }

      if(options.enableInteraction){
        options.interactionFn ? options.interactionFn(panel, self.propertyMap) : addInteraction(panel, options);
      }
    } else {
      panel.style("display", "none"); // hide on no data
    }
  }

  function offsetLabels(panel) {
    // offset side labels to not cover chart
    let residentialLabel = panel.select("text#Residential"),
      parkLabel = panel.select("text#POS");
    residentialLabel.attr('x', +residentialLabel.attr('x') + 10);
    parkLabel.selectAll('tspan').attr('x', +parkLabel.attr('x') - 10);
  }

  // based off of http://bl.ocks.org/kevinschaul/8833989
  function addInteraction(panel, interactionOptions) {
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
      }).on('click', function(d){
        let elem = d3.select(this);

        if(selectionElem){
          selectionElem.style("stroke-width",null)
            .style("fill-opacity", null);
        }

        if(selectionKey !== d.key){
          let percent = (d.datum[d.key] / dataRanges[d.key][1]) * 100;

          let htmlText = interactionOptions.htmlFn ? interactionOptions.htmlFn(d, self.propertyMap) : `<b>${self.propertyMap[d.key]}:</b><br>${d.datum[d.key]} (${percent.toFixed(2)}%) of ${dataRanges[d.key][1]} total lots`;
          dataText.html(htmlText)
            .classed("empty", false);

          selectionElem = elem.style("stroke-width", "2px").style("fill-opacity","0.4");
          selectionKey = d.key;
        }else{
          selectionKey = null;
          selectionElem = null;
          dataText.text(defaultText).classed("empty", true);
        }
      });
    
  }

  return {
    title: self.title,
    id: self.id,
    init,
    update
  }
}
