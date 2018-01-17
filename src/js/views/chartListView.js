"use strict";

var App = App || {};

let ChartListView = function(listID) {
  let self = {
    chartHeight: 200,
    chartMargins: {
      top: 10,
      right: 20,
      bottom: 25,
      left: 50
    },
    barThickness: 100,
    chartList: null,
    selections: {},
    propertyScales: null,
    chartData: {} //keyed by createPropertyID(); contains property_data used to init charts
  };

  init();

  function init() {
    self.chartList = d3.select(listID)

    self.propertyScales = {
      census: {
        "TOTAL_POPULATION": {
          "Total": d3.scaleLinear()
        },
      }
    }

    //default entry
    // addServiceChart({
    //   mainType: "All Services",
    //   subType: "Total Count",
    //   type: "service"
    // });
    checkSelections();
  }

  function addErrorChart(message){
    return self.chartList.append("div")
      .attr("class", "panel panel-default chartEntry")
      .attr("id", "error-selection-chart")
      .append("div").classed('panel-body', true)
      .text(message);
  }

  function checkSelections(){
    let neededSelections = 2 - Object.keys(self.selections).length;
    console.log("neededSelections", neededSelections);
    let censusCharts = self.chartList.selectAll(".census");
    let lotCharts = self.chartList.selectAll(".vacantLotChart");
    self.chartList.selectAll('#error-selection-chart').remove();
    if(censusCharts.empty() || lotCharts.empty()){
      if(neededSelections > 0 && lotCharts.empty() && censusCharts.empty()){ //show selection message if no charts are currently showing
          // addErrorChart(`Select ${neededSelections} ${neededSelections === 1 ? "area" : "areas"} where you'd like to compare data`);
          addErrorChart("Please wait until data has finished loading");
      }else{
        if(censusCharts.empty()){
          addErrorChart("Select a census category to compare census data across the selected areas.");
        }
        // if(serviceCharts.empty()){
        //   addErrorChart("Select a service category to compare service data across the selected areas.");
        // }
      }
    }
    return neededSelections;
  }

  function makeCollapsing(buttonID, listWrapperID) {
    let mobile = window.innerWidth < 769;

    self.wrapper = d3.select(listWrapperID)
      .style("pointer-events", mobile ? "none" : "all")
      .style("opacity", mobile ? 0 : 1)
      .style("height", (window.innerHeight - $(d3.select(".navbar").node()).height()) + "px");

    self.toggleButton = d3.select(buttonID).classed("open", !mobile)
      .on("click", function(d) {
        let open = !d3.select(this).classed("open");
        d3.select(this).classed("open", open);

        d3.select(this).select(".glyphicon").attr("class", open ? "glyphicon glyphicon-eye-close" : "glyphicon glyphicon-eye-open");
        if (open) {
          document.getElementById("chartListButtonText").innerHTML = "Hide Chart List";
        }
        else {
          document.getElementById("chartListButtonText").innerHTML = "Show Chart List";
        }

        self.wrapper
          .style("pointer-events", open ? "all" : "none")
          .style("opacity", open ? 1 : 0);
      });
  }

  function resize() {
    let mobile = window.innerWidth < 769;

    self.wrapper
      .style("height", window.innerHeight - $(d3.select(".navbar").node()).height() + "px");
  }

  function createChart(property_data, customTitle) {
    console.log("createChart",property_data);

    self.chartData[createPropertyID(property_data)] = property_data;

    return self.chartList.append("div")
      .datum(property_data)
      .attr("class", "panel panel-default chartEntry")
      .attr("id", createPropertyID(property_data))
      .classed("census", property_data.type === "census")
      .classed("service", property_data.type === "service")
      .each(function(d,i) {
        setupChart(this,d,customTitle)
      });
  }

  // custom graph functions can be defined in property_data
  // property_data.graph = { init(parent_element), update(property_data) }
  function setupChart(target, property_data, customTitle) {
    let panel = d3.select(target);

    let heading = panel.append("div").attr("class", "panel-heading").append('div').classed('row',true);

    let mainTypeTitle = property_data.mainType.split("_").map((d) => { return `${d[0].toUpperCase()}${d.slice(1).toLowerCase()}`; }).join(" ");
    let propertyTitle = heading.append('h4').attr('class', 'col-md-10 propertyTitle text-left');
    let fullTitle;
    if(customTitle){
      fullTitle = customTitle;
    }else if(property_data.type !== "service"){
      fullTitle = `<b>${mainTypeTitle}:</b> ${property_data.subType.replace(/[^a-zA-Z0-9- ]/g, "")}`;
    }else{
      fullTitle = `<b>${mainTypeTitle}:</b> ${property_data.subType.replace(/[^a-zA-Z0-9- ]/g, "")}`;
    }

    propertyTitle.html(fullTitle);
    
    if (!((property_data.mainType.toLowerCase() === "all services" && property_data.subType.toLowerCase() === "total count") || property_data.type === "lot")){
      heading.append('h4').append('span').attr('class', 'col-md-2 glyphicon glyphicon-remove text-right')
        .on('click',function(){
          if(property_data.type === "census"){
            // removePropertyChart(property_data);
            App.controllers.mapData.resetFilters();
          }else if(property_data.type === "service"){
            // removeServiceChart(property_data);
            App.controllers.serviceFilterDropdown.resetFilters();
          }else{
            console.log("Unknown chart type",property_data.type);
            App.controllers.mapData.removeChartFromList(property_data);
          }
        });
    }

    // let area = heading.append("h4").attr("class", "rectArea").html(`Area (mi<sup>2</sup>): ${d.area.toFixed(2)}`);

    let body = panel.append("div").attr("class", "panel-body");

    if(!property_data.graph){
      let chart = body.append("svg");
      console.log($(chart.node()).height());
      console.log(chart.node(), body.node(), panel.node());

      let graph = chart.append('g').classed('graph-group', true);

      graph.background = graph.append("rect")
        .attr("x", self.chartMargins.left)
        .attr("y", self.chartMargins.top)
        .attr("width", $(chart.node()).width() - self.chartMargins.left - self.chartMargins.right)
        .attr("height", $(chart.node()).height() - self.chartMargins.top - self.chartMargins.bottom)
        .classed('graph-background', true).style('stroke', 'none');
      console.log(graph.node(), graph.background.node());
      graph.content = graph.append('g').classed('graph-content', true);
    }else{
      body.datum(property_data)
      property_data.graph.init(body);
    }

    updateChart(createPropertyID(property_data));
    checkSelections();
  }

  function drawGraphBars(graph,data){
    let selectionKeys = Object.keys(self.selections);
    let boundsX = [0, +graph.background.attr('width')];
    let xScale = d3.scaleLinear().domain([0, selectionKeys.length]).range(boundsX);

    let barThickness = self.barThickness;
    let barWidth = xScale.range()[1] / selectionKeys.length;
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
            App.views.map.centerAroundSelection(self.selections[selectionKeys[index]]);
          });

        let textSize = 14;
        let textOffsetY = boundsY[0] + yOffset * 1.5 + textSize * 1.15;
        let textOffsetX = (barWidth / 2);

        graph.content.append('text')
          .attr('x', xOffset + barWidth * index + textOffsetX).attr('y', textOffsetY)
          .attr('text-anchor', 'middle').style('font-size', textSize)
          .text(`${self.selections[selectionKeys[index]].id}`);
      });

    let yAxis = d3.axisLeft(yScale)
      .tickValues([yScale.domain()[0], (yScale.domain()[1] - yScale.domain()[0]) / 2, yScale.domain()[1]]);
      // .tickFormat(d3.format(",.2f"));
    graph.content.append('g').classed('axis', true)
      .attr('transform', `translate(${xOffset},${yOffset})`).call(yAxis);

    let xAxis = d3.axisBottom(xScale).tickFormat(() => { return ""; }).ticks(1);
    graph.content.append('g').classed('axis', true)
      .attr('transform', `translate(${xOffset},${boundsY[0] + yOffset})`).call(xAxis);
  }

  function updateLotChart(chart, property_data){
    chart = chart || self.chartList.select(".vacantLotChart"); //only one lot chart at a single time
    let graph = chart.select('.graph-group');
    graph.selectAll("g.graph-content").remove();
    graph.background = graph.select('.graph-background');
    graph.content = graph.append('g').classed('graph-content', true);

    let selectionKeys = Object.keys(self.selections);
    let data = [];
    for(let s of selectionKeys){
      let curSelection = self.selections[s];
      let lotArray = curSelection.data.lot || [];
      data.push({
        value: lotArray.length,
        color: curSelection.color
      });
    }

    console.log("selection bar lot data", data);

    //only draw bars when there are 2 selections
    if (data.length > 1) {
      drawGraphBars(graph,data);
    } else {
      let text_element = graph.content.append('text')
        .attr('text-anchor', 'middle')
        .attr("x", +graph.background.attr('width') / 2 + self.chartMargins.left / 2 + self.chartMargins.right / 2)
        .attr("y", +graph.background.attr('height') / 2)
        // .attr("x", self.chartMargins.left + 5)
        // .attr("y", self.chartMargins.top + 15)
      addMultilineText(text_element, [`Select ${2 - data.length} more ${2 - data.length === 1 ? "area" : "areas"} where you'd`, `like to compare data`]);
    }

    chart.selectAll('.panel-footer').remove();

  }

  function updateCensusChart(chart, property_data){
    chart = chart || self.chartList.select(".census"); //only one census property at a single time
    let graph = chart.select('.graph-group');
    graph.selectAll("g.graph-content").remove();
    graph.background = graph.select('.graph-background');
    graph.content = graph.append('g').classed('graph-content', true);
    
    let selectionKeys = Object.keys(self.selections);
    let data = [];
    for (let s of selectionKeys) {
      let curSelection = self.selections[s];
      let area = curSelection.area;
      let propertyValue;
      try {
        propertyValue = curSelection.data.census[property_data.mainType][property_data.subType];
      } catch (err) {
        console.error(err);
        propertyValue = 0;
      }
      //show data totals
      data.push({
        value: (propertyValue) || 0, //fix for NaN values
        color: curSelection.color,
        // id: curSelection.id
      });
    }

    console.log("selection bar census data", data);

    //only draw bars when there are 2 selections
    if (data.length > 1) {
      drawGraphBars(graph,data);
    } else {
      let text_element = graph.content.append('text')
        .attr('text-anchor','middle')
        .attr("x", +graph.background.attr('width') / 2 + self.chartMargins.left / 2 + self.chartMargins.right / 2)
        .attr("y", +graph.background.attr('height') / 2)
        // .attr("x", self.chartMargins.left + 5)
        // .attr("y", self.chartMargins.top + 15)
        addMultilineText(text_element,[`Select ${2 - data.length} more ${2 - data.length === 1 ? "area" : "areas"} where you'd`,`like to compare data`]);
    }

    chart.selectAll('.panel-footer').remove();

    chart.append('div').attr("class", 'panel-footer text-left', true)
      .html("<b>Census Count</b>");
  }

  function addMultilineText(text_element,message_arr, options){
    options = options || {};
    let x = options.x || +text_element.attr('x') || 0;
    return text_element.selectAll("tspan").data(message_arr)
      .enter().each(function(d,i){
        console.log(d);
        d3.select(this).append('tspan')
          .attr('dy', i * 16) //distance between text lines
          .attr('x', x)
          .text(d);
      })
  }

  //redraw selection bars
  function updateChart(chartID) {
    if(typeof chartID === "object"){ //given a property object
      chartID = createPropertyID(chartID);
    }
    console.log("updating chart",chartID);

    if(!chartID){
      console.log("No chartID specified");
      return;
    }
    let property_data = self.chartData[chartID];
    let chart = self.chartList.select(`#${chartID}`);
    try{
      let graph = chart.select('.graph-group');
      if(!property_data){
        graph.background = graph.select('.graph-background');
        console.log(graph.background.node());
        graph.selectAll('.error-text').remove();
        graph.selectAll('g.graph-content').remove();
        graph.content = graph.append('g').classed('graph-content', true); 
        property_data = JSON.parse(graph.background.attr('property-data'));
      }
      if(property_data.graph){
        property_data.graph.update(property_data);
      } else if(property_data.type == "census"){
        updateCensusChart(chart,property_data);
      }else if (property_data.type === "service"){
        // updateServiceChart(chart,property_data);
      }else if (property_data.type === "lot"){
        updateLotChart(chart,property_data);
      }else{
        graph.content.append('text')
          .attr("x", self.chartMargins.left + 5)
          .attr("y", self.chartMargins.top + 15)
          .text(`Data: ${JSON.stringify(property_data)}`);
      }
    }catch(err){
      //fall back for error
      console.log("chart draw error", err);
      graph.select('.graph-content').remove();

      graph.append("text").classed('error-text', true)
        .attr("x", self.chartMargins.left + 5)
        .attr("y", self.chartMargins.top + 15)
        .text(`Error occurred while drawing selections`);
    }
  }

  function createPropertyID(property_data){
    let mainTypeTitle = property_data.mainType.split("_").map((d) => { return `${d[0].toUpperCase()}${d.slice(1).toLowerCase()}`; }).join("_");
    let subTypeTitle = property_data.subType.split(" ").join("_");
    return `${mainTypeTitle}__${subTypeTitle}`.replace(/[^a-zA-Z0-9_]/g,""); //remove any non-alpha numberic characters except underscores
  }


  function addPropertyChart(property_data, customTitle){
    if (self.chartList.selectAll(`#${createPropertyID(property_data)}`).empty()) {
      self.chartList.selectAll('.census').remove();
      return createChart(property_data, customTitle);
    } else {
      console.log("Already exists");
    }
  }

  function removePropertyChart(property_data) {
    removeChart(createPropertyID(property_data));

    if (self.chartList.selectAll(`.census`).empty()) {
      checkSelections();
    }
  }

  function addLotChart(customTitle){
    if (self.chartList.selectAll(`.vacantLotChart`).empty()) {
      // self.chartList.selectAll('.vacantLotChart').remove();
      return createChart({
        mainType: "Vacant Lots",
        subType: "Total",
        type: "lot"
      }, customTitle);
    } else {
      console.log("Already exists");
    }
  }

  function addServiceChart(service_data, customTitle){
    if (self.chartList.selectAll(`#${createPropertyID(service_data)}`).empty()) {
      self.chartList.selectAll('.service').remove();
      return createChart(service_data, customTitle);
    } else {
      console.log("Already exists");
    }
  }

  function removeServiceChart(service_data) {
    removeChart(createPropertyID(service_data));

    if (/*self.chartList.selectAll(`.service`).empty()*/ false) {
      addServiceChart({ //show all services by default
        mainType: "All Services",
        subType: "Total Count",
        type: "service"
      });
      checkSelections();
    }
  }

  function updateCharts(){
    self.chartList.selectAll('.chartEntry')
      .each(updateChart);
  }

  function addSelection(properties){
    console.log("addSelection",properties);
    self.selections[properties.id.toString()] = properties;

    updatePropertyExtents();

    checkSelections();
    updateCharts();
  }

  function removeSelection(id){
    if(typeof id === "object"){ //id is a properties object
      delete self.selections[id.id.toString()];
    }else{
      delete self.selections[id.toString()];
    }

    updatePropertyExtents();
    checkSelections();
    updateCharts();
  }

  function removeChart(id) {
    self.chartList.select(`#${id}`).remove();

    updatePropertyExtents();

    updateCharts();
  }

  function updatePropertyExtents() {
    console.log("Temporarily disabled updatePropertyExtents");
    // for (let dataSource of Object.keys(self.propertyScales)) {
    //   for (let property of Object.keys(self.propertyScales[dataSource])) {
    //     for (let subproperty of Object.keys(self.propertyScales[dataSource][property])) {
    //       self.propertyScales[dataSource][property][subproperty].domain(
    //         d3.extent(d3.selectAll(".chartEntry").nodes(), (node) => {
    //           // get that data value from node
    //           let rect = d3.select(node).datum();
    //           return rect.data[dataSource][property][subproperty] / rect.area;
    //         }));

    //       console.log(dataSource, property, subproperty, self.propertyScales[dataSource][property][subproperty].domain());
    //     }
    //   }
    // }
  }

  return {
    createChart,
    removeChart,
    addPropertyChart,
    removePropertyChart,
    addServiceChart,
    removeServiceChart,
    addLotChart,
    addSelection,
    removeSelection,
    makeCollapsing,
    resize,
    updateChart
  };
};
