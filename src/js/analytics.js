"use strict";

var App = App || {};

let documentPromise = new Promise(function(resolve, reject) {
  $(document).ready(function() {
    console.log("$(document).ready done");
    resolve();
  });
});

let windowPromise = new Promise(function(resolve, reject) {
  $(window).on("load", function() {
    console.log("$(window).on('load') done");
    resolve();
  });
});

// make sure both the document and CSS are loaded
Promise.all([documentPromise, windowPromise, less.pageLoadFinished])
  .then(function() {
    setTimeout(function() {
      App.init();
    }, 500);
  })
  .catch(function(err) {
    console.log(err);
  });

(function() {
  App.models = {};
  App.views = {};
  App.controllers = {};

  // models
  App.models.socialServices = new SocialServiceModel();
  App.models.serviceTaxonomy = new ServiceTaxonomyModel();
  App.models.censusData = new CensusDataModel();
  App.models.boundaryData = new BoundaryDataModel();
  App.models.landInventory = new LandInventoryModel();
  App.models.schoolData = new SchoolDataModel();
  App.models.crimeData = new CrimeDataModel();

  // views


  // controllers
  App.controllers.serviceFilterDropdown = new FilterDropdownController();
  App.controllers.mapData = new MapDataController();
  // App.controllers.locationButton = new LocationButtonController();
  App.controllers.search = new SearchController();

  App.init = function () {
    $('[data-toggle="tooltip"]').tooltip(); //needed for button tooltips
    App.views.loadingMessage = new LoadingMessageView("#loading-indicator");

    App.views.browserMessage = new BrowserMessageView("#browserModal");
    App.models.browser = new BrowserModel();
    App.controllers.browserMessage = new BrowserMessageController();
    
    console.log("Loading Analytics");
    App.views.loadingMessage.startLoading("Loading Map");
    App.views.map = new MapView("serviceMap");
    App.views.map.drawEnglewoodOutline();

    App.views.loadingMessage.updateAndRaise("Initializing buttons and interface elements");
    App.views.chartList = new ChartListView("#chartList");
    App.views.chartList.makeCollapsing("#toggleHideChartsButton", "#chartListWrapper");

    App.controllers.serviceFilterDropdown.setFilterDropdown("#filterDropdownList", "#filterDropdownButton");
    App.controllers.serviceFilterDropdown.attachAllServicesButton("#allServicesButton");
    
    App.controllers.serviceMarkerView = new LeafletMarkerViewController("#toggleServiceView","#serviceViewText", "Service");
    App.controllers.landMarkerView = new LeafletMarkerViewController("#toggleLotView", "#lotViewText", "Vacant Lot");
    App.controllers.schoolMarkerView = new LeafletMarkerViewController("#toggleSchoolView", "#schoolViewText", "School");

    App.controllers.mapData.setupDataPanel("#mapPanelToggle", "#mapSettingsPanel");
    App.controllers.mapData.attachResetOverlayButton("#resetMaps");
    App.controllers.mapData.setChartList(App.views.chartList);

    App.controllers.search.attachDOMElements("#searchInput", "#searchButton");

    App.views.loadingMessage.updateAndRaise("Loading location, service, and census data");
    let numFinished = 0;
    let socialServiceP = App.models.socialServices.loadData("./admin-data/EnglewoodLocations.csv")
      .then((data) => {
        console.log("Loaded Social Services", ++numFinished);
        return data;
      });
    let serviceTaxonomyP = App.models.serviceTaxonomy.loadData("./data/serviceTaxonomy.json")
      .then((data) => {
        console.log("Loaded Service Taxonomy", ++numFinished);
        return data;
      });
    let boundaryDataP = App.models.boundaryData.loadData()
      .then((data) => {
        console.log("Loaded Boundary Data", ++numFinished);
        return data;
      });
    let censusDataP = App.models.censusData.loadData()
      .then(function (data) {
        let overlayData = data[0];
        let overlayCategories = data[1];

        App.controllers.mapData.populateDropdown(overlayCategories, max_subdropdown_height);

        console.log("Loaded Census Data", ++numFinished);
        return data;
      });
    let landInventoryP = App.models.landInventory.loadData()
      .then((data) => {
        console.log("Loaded Land Inventory Data", ++numFinished);
        return data;
      });
    let schoolDataP = App.models.schoolData.loadData("./data/17-12-05 Englewood Schools.csv")
      .then(data => {
        console.log("Loaded School Data", ++numFinished);
        return data;
      });
    // let crimeDataP = App.models.crimeData.loadData()
    //   .then((data) => {
    //     console.log("Loaded Crime Data");
    //     return data;
    //   });

    App.controllers.mapData.setCensusClearButton();

    // load other data sources when asked to plot
    let max_subdropdown_height = d3.select('body').node().clientHeight * 0.4;

    console.time("load data");
    Promise.all([socialServiceP, serviceTaxonomyP, boundaryDataP, censusDataP, landInventoryP, schoolDataP])
      .then(function(values) {
        // App.views.map.createMap();
        console.timeEnd("load data");

        console.time("plotting data");
        App.views.loadingMessage.updateAndRaise("Plotting services and lots");
        App.views.map.plotServices(App.models.socialServices.getData());
        App.views.map.plotLandInventory(App.models.landInventory.getDataByFilter());
        App.views.map.plotSchools(App.models.schoolData.getData());

        // App.views.chartList...
        console.timeEnd("plotting data");

        console.time("populating dropdown");
        App.controllers.serviceFilterDropdown.populateDropdown(max_subdropdown_height);
        console.timeEnd("populating dropdown");

        //start off with markers hidden
        console.time("setting marker visibility");
        App.controllers.serviceMarkerView.setVisibilityState(false); 
        App.controllers.landMarkerView.setVisibilityState(false); 
        App.controllers.schoolMarkerView.setVisibilityState(false);
        console.timeEnd("setting marker visibility");

        //set two selections to be west englewood and englewood
        console.time("getting selection data");
        App.views.loadingMessage.updateAndRaise("Filtering data for West Englewood and Englewood");
        aggregateData();
        console.timeEnd("getting selection data");
        console.log(App.models.aggregateData);

        App.views.loadingMessage.updateAndRaise("Adding charts");

        App.views.chartList.addChart(new VacantLotBarChart(App.models.aggregateData.englewood,App.models.aggregateData.westEnglewood));
        App.views.chartList.updateChart("vacant-lots-total");

        let [lotRanges, lotData] = generateLotKiviatData(App.models.landInventory.getDataByFilter(), true);

        console.log(lotRanges,lotData);

        let englewoodKiviatData = generateLotKiviatData(App.models.aggregateData.englewood.data.lot, false);
        let westEnglewoodKiviatData = generateLotKiviatData(App.models.aggregateData.westEnglewood.data.lot, false);

        App.views.chartList.addChart(new VacantLotStarPlot("vacant-lot-overall-star-plot","<h4><b>Vacant Lots:</b> Overall</h4>", lotRanges));
        App.views.chartList.updateChart("vacant-lot-overall-star-plot", {}, {renderLabels: true}); // init labels and outline
        App.views.chartList.updateChart("vacant-lot-overall-star-plot", lotData, { groupID: 'overall', fillColor: '#e8e031'});
        App.views.chartList.updateChart("vacant-lot-overall-star-plot", englewoodKiviatData, { groupID: 'englewood', fillColor: App.models.aggregateData.englewood.color });
        App.views.chartList.updateChart("vacant-lot-overall-star-plot", westEnglewoodKiviatData, 
          { 
            groupID: 'westEnglewood', 
            fillColor: App.models.aggregateData.westEnglewood.color,
            enableInteraction: true,
            interactionFn: (panel, propertyMap) => {
              let svg = panel.select('.panel-body svg');
              let footer = panel.select('.panel-footer');

              let dataText = footer.append("div").attr("class", "interaction data-text");

              let interactionObjects = panel.selectAll(".interaction").style('display', 'none');

              svg.selectAll(".star-interaction")
                .classed('hoverable', true)
                .on('mouseover', (d) => {
                  interactionObjects.style('display', 'block');

                  let totalPercent = (lotData[d.key] / lotRanges[d.key][1]) * 100,
                  englewoodPercent = (englewoodKiviatData[d.key] / lotRanges[d.key][1]) * 100,
                  westEnglewoodPercent = (westEnglewoodKiviatData[d.key] / lotRanges[d.key][1]) * 100;

                  dataText.html(`<b><u>${propertyMap[d.key]}:</u></b><br>
                    <b>Overall:</b> ${lotData[d.key]} (${totalPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} total lots<br>
                    <b>Englewood:</b> ${englewoodKiviatData[d.key]} (${englewoodPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} total lots<br>
                    <b>West Englewood:</b> ${westEnglewoodKiviatData[d.key]} (${westEnglewoodPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} total lots
                  `);
                }).on('mouseout', (d) => {
                  interactionObjects.style('display', 'none');
                });
            }
          });
        

        // insert icons
        d3.selectAll(".svg-insert").html(function(){
          let id = d3.select(this).attr("id");
          console.log("svg id", id);
          if(!id ){
            return "";
          }else{
            return new L.DivIcon.SVGIcon({
              color: App.views.map.getIconColor(id) || "black",
              fillOpacity: 1,
              // circleWeight: 3.5,
              iconSize: [14, 23],
            }).options.html;
          }
        });

        App.views.loadingMessage.finishLoading();

        App.controllers.browserMessage.runBrowserCheck();
      })
      .catch(function(err) {
        console.error(err);
        try{
          App.views.loadingMessage.updateAndRaise("Encountered an error.<br>Please try reloading or contact technical support.");
        }catch(loadingError){
          console.log("Error showing loading message:",loadingError);
        }
        
      });
  };

  function generateLotKiviatData(lotData, generateRange) {
    let data = {
      Residential: [],
      PD: [],
      POS: [],
      BCM: []
    };
    let total = lotData.length;

    lotData.forEach(d => {
      let zone = d["Zoning Classification"];
      if (zone.indexOf("R") === 0) {
        data.Residential.push(d);
      } else if (zone.indexOf("PD") === 0 || zone.indexOf("PMD") === 0) {
        data.PD.push(d);
      } else if (zone.indexOf("POS") === 0) {
        data.POS.push(d);
      } else if (zone.indexOf("B") === 0 || zone.indexOf("C") === 0 || zone.indexOf("M") === 0) {
        data.BCM.push(d);
      } else {
        console.log("Ignoring zone", zone);
      }
    });

    let filteredData = {};
    let zoneRanges = {};

    for (let zoneType in data) {
      filteredData[zoneType] = data[zoneType].length;
      zoneRanges[zoneType] = [0, total];
    }

    return generateRange ? [zoneRanges, filteredData] : filteredData;
  }

  function aggregateData() {
    let westEnglewoodPoly = App.models.boundaryData.getWestEnglewoodPolygon();
    let englewoodPoly = App.models.boundaryData.getEnglewoodPolygon();
    let splitLotData = App.models.landInventory.splitDataByEnglewood_WestEnglewood();
    let selectionData = {
      westEnglewood: {
        data: {
          census: App.models.censusData.getDataWithinPolygon(westEnglewoodPoly).dataTotals,
          // lot: App.models.landInventory.getDataByFilter((a) => { return a.Area === "West Englewood"; })
          lot: splitLotData.westEnglewood
        },
        area: turf.area(westEnglewoodPoly) / (1000 * 1000), //turf.area returns area in m^2, divide by 1000^2 to get km^2
        color: "#1f77b4",
        id: "West Englewood",
        bounds: (function (poly) {
          console.time("bounds get");
          let coordsArr = poly.geometry.coordinates[0];
          let latExtent = d3.extent(coordsArr, d => d[1]);
          let lngExtent = d3.extent(coordsArr, d => d[0]);

          console.timeEnd("bounds get");

          return [
            [latExtent[0], lngExtent[0]],
            [latExtent[1], lngExtent[1]],
          ];
        })(westEnglewoodPoly)
      },
      englewood: {
        data: {
          census: App.models.censusData.getDataWithinPolygon(englewoodPoly).dataTotals,
          // lot: App.models.landInventory.getDataByFilter((a) => { return a.Area === "Englewood"; })
          lot: splitLotData.englewood
        },
        area: turf.area(englewoodPoly) / (1000 * 1000), //turf.area returns area in m^2, divide by 1000^2 to get km^2
        color: "#ff7f0e",
        id: "Englewood",
        bounds: (function (poly) {
          console.time("bounds get");
          let coordsArr = poly.geometry.coordinates[0];
          let latExtent = d3.extent(coordsArr, d => d[1]);
          let lngExtent = d3.extent(coordsArr, d => d[0]);

          console.timeEnd("bounds get");
          return [
            [latExtent[0], lngExtent[0]],
            [latExtent[1], lngExtent[1]],
          ];
        })(englewoodPoly)
      }
    };

    App.models.aggregateData = selectionData;
  }

})();
