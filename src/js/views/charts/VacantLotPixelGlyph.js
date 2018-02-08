"use strict";

function VacantLotPixelGlyph(id, title, dataRanges, options = {}) {
  let self = {
    title: title,
    id: id,
    pixelGlyph: null,
    quadrants: {
      topLeft: {
        name: 'Residential',
        color: '#999999',
        maxValue: null,
      },
      topRight: {
        name: "BCM",
        label: "Business, Commercial, and Manufacturing",
        graphLabel: ["Business,", "Commercial,", "and Manufacturing"],
        color: '#ff7f00',
        maxValue: null,
      },
      bottomLeft: {
        name: 'POS',
        label: "Parks and Open Space",
        graphLabel: ["Parks and", "Open Space"],
        color: '#4daf4a',
        maxValue: null,
      },
      bottomRight: {
        name: "PD",
        label: "Planned Manufacturing Districts and Development",
        graphLabel: ["Planned", "Manufacturing", "Districts and", "Development"],
        color: '#e78ac3',
        maxValue: null,
      },
    }
  };

  function init(chartPanel) {
    initQuadrants();
    console.log(self.quadrants);
    self.pixelGlyph = new PixelGlyph({
      quadrants: self.quadrants
    });

    self.pixelGlyph.init(chartPanel.select(".panel-footer"));

    if(options.init){
      options.init(chartPanel);
    }
  }

  function initQuadrants() {
    for(let q in self.quadrants){
      let quadrant = self.quadrants[q];

      quadrant.maxValue = dataRanges[quadrant.name];
    }
  }

  function update(panel, data) {
    console.log("pixel glyph data",data);
    self.pixelGlyph.update(panel, data);
    updateStatistics(panel, data);
  }

  function updateStatistics(panel,data) {
    let body = panel.select('.panel-body');

    if(!body.select('table').empty()){
      body.select('table').remove();
    }
    let table = body.append('table').classed('container', true)
      .style('width', '100%').append('tbody');

    let propertiesLines = Object.keys(self.quadrants).map(d => {
      let value = data[self.quadrants[d].name];
      let percent = ((value / self.quadrants[d].maxValue) * 100).toFixed(2);
      return { 
        value, 
        percent,
        name: self.quadrants[d].name,
        label: self.quadrants[d].label,
        total: self.quadrants[d].maxValue,
        color: self.quadrants[d].color,
       };
    });

    let colorScale = d3.scaleLinear().domain([0, 1]);
    table.selectAll('tr').data(propertiesLines)
      .enter().append('tr')
      // .style("background-color", d => colorScale.range(["#FFF", d.color])(0.75))
      .each(function(d){
        let row = d3.select(this);

        row.append('td').classed('align-middle', true)
          .style("width", "50px").style("text-align", "left")
          .html(`<span id=${d.name} class="svg-insert">`)

        row.append('td').classed('align-middle', true)
          .style("width", "47.5%").style("text-align", "left")
          .style("padding-left", "5px")
          .html(`</span><b>${d.label || d.name}</b>`)
        row.append('td').classed('align-middle', true)
          .style("width", "52.5%")
          .text(`${d.value} (${d.percent}%) of ${d.total} lots`)
      });

    App.insertIcons();
  }

  return {
    title: self.title,
    id: self.id,
    init,
    update
  };
}
