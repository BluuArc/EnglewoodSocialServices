"use strict";

let ChartListView = function(listID){
  let self = {
    chartListDOM: null,
    chartList: {},

    wrapper: null,
    toggleButton: null
  };

  init();

  function init() {
    self.chartListDOM = d3.select(listID);
  }

  function makeCollapsing(buttonID, listWrapperID) {
    let mobile = window.innerWidth < 769;

    let wrapperHeight = (window.innerHeight - $(d3.select(".navbar").node()).height()) + "px";

    self.wrapper = d3.select(listWrapperID)
      .style("pointer-events", mobile ? "none" : "all")
      .style("opacity", mobile ? 0 : 1)
      .style("height", wrapperHeight);

    self.chartListDOM.style("height", `calc(${wrapperHeight} - 3em - 10px)`);

    self.toggleButton = d3.select(buttonID).classed("open", !mobile)
      .on("click", function (d) {
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

  function initializeDefaultChart(id, title, canDelete) {
    let chartElement = self.chartListDOM.insert("div", ":first-child") //add to top of list
        .attr("class", "panel panel-default chartEntry")
        .attr("id",id);

    // initialize header
    let heading = chartElement.append("div").classed("panel-heading", true)
        .append("div").classed("row", true);

    heading.append("span").attr("class","text-left col-md-10")
        .html(title);

    if(canDelete){
        heading.append('h4').append('span')
            .attr('class', 'col-md-2 glyphicon glyphicon-remove text-right')
            .on('click', function (evt) {
                removeChart(id, evt);
            });
    }

    // create empty body and footer
    chartElement.append("div").classed("panel-body", true);
    chartElement.append("div").classed("panel-footer",true);

    return chartElement;
  }

  /*
    options = {
      title: title of chart in HTML code
      id: chart entry ID (no # sign)
      init: function(chart:d3 selection of chart entry) => returns nothing
        called when chart is first created
      update: function(chart:d3 selection of chart entry, data) => returns nothing
        DOM manipulation occurs here
      remove: function(data) => returns nothing // OPTIONAL, X button is shown if defined
        this is run on button click or when the remove chart function is called
        used to do any data cleanup (if necessary)
        chart removal from DOM happens after this function is run by chartListView
    }
  */
  function addChart(options){
    console.log("Adding chart:", options.id);
    let chartList = self.chartList;

    if(chartList[options.id]){
      throw Error(`Chart with ID ${options.id} already exists`);
    }

    chartList[options.id] = {
      el: initializeDefaultChart(options.id, options.title, options.remove),
      update: options.update,
      remove: options.remove || function(){ console.log("removing chart", options.id); }
    };

    options.init(chartList[options.id].el);
  }

  function removeChart(id, ...data) {
    console.log("Removing chart:", id);
    if(self.chartList[id].remove){
      self.chartList[id].remove(...data);
    }
    self.chartList[id].el.remove();
    delete self.chartList[id];
  }

  function updateChart(id, ...data) {
    console.log("Updating chart:", id);
    self.chartList[id].update(self.chartList[id].el, ...data);
  }

  return {
    makeCollapsing,
    addChart,
    updateChart,
    removeChart
  }
}