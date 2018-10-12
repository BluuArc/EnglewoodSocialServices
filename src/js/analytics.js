/* global $ d3 less L turf */
'use strict';

var App = App || {};

let documentPromise = new Promise(function(resolve) {
  $(document).ready(function() {
    console.debug('$(document).ready done');
    resolve();
  });
});

let windowPromise = new Promise(function(resolve) {
  $(window).on('load', function() {
    console.debug('$(window).on(\'load\') done');
    resolve();
  });
});

// make sure both the document and CSS are loaded
Promise.all([documentPromise, windowPromise, less.pageLoadFinished])
  .then(function() {
    setTimeout(function() {
      App.init();
    }, 500);
  }).catch(function(err) {
    console.error(err);
  });

(function() {
  App.models = {};
  App.views = {};
  App.controllers = {};

  /* eslint-disable no-undef */
  // models
  App.models.serviceData = new ServiceDataModel();
  App.models.serviceTaxonomy = new ServiceTaxonomyModel();
  App.models.censusData = new CensusDataModel();
  App.models.boundaryData = new BoundaryDataModel();
  App.models.landInventory = new LandInventoryModel();
  App.models.schoolData = new SchoolDataModel();
  App.models.crimeData = new CrimeDataModel();

  // views


  // controllers
  App.controllers.serviceFilterDropdown = new ServiceFilterController();
  App.controllers.dataDownload = new DataDownloadController('https://quahog.evl.uic.edu/');
  // App.controllers.serviceFilterDropdown = new FilterDropdownController();
  App.controllers.mapData = new MapDataController();
  // App.controllers.locationButton = new LocationButtonController();
  App.controllers.search = new SearchController();
  /* eslint-enable no-undef */

  App.init = function () {
    $('[data-toggle="tooltip"]').tooltip(); //needed for button tooltips
    /* eslint-disable no-undef */
    App.views.loadingMessage = new LoadingMessageView('#loading-indicator');

    App.views.browserMessage = new BrowserMessageView('#browserModal');
    App.models.browser = new BrowserModel();
    App.controllers.browserMessage = new BrowserMessageController();
    
    console.info('Loading Analytics');
    App.views.loadingMessage.startLoading('Loading Map');
    App.views.map = new MapView('serviceMap');
    App.views.map.drawEnglewoodOutline();
    App.views.mapLegend = new MapLegendView({
      parent: d3.select('#legend')
    });
    App.views.map.drawLegend();
    
    App.views.loadingMessage.updateAndRaise('Initializing buttons and interface elements');
    App.views.chartList = new ChartListView('#chartList');
    App.views.chartList.makeCollapsing('#toggleHideChartsButton', '#chartListWrapper');

    App.controllers.serviceFilterDropdown.setFilterDropdown('#filterDropdownList', '#filterDropdownButton');
    App.controllers.serviceFilterDropdown.attachServiceResetBtn('#allServicesButton');
    
    App.controllers.serviceMarkerView = new MarkerToggleController('#toggleServiceView','#serviceViewText', 'Service');
    App.controllers.schoolMarkerView = new MarkerToggleController('#toggleSchoolView', '#schoolViewText', 'School');
    App.controllers.lotTypeMarkerView = new MarkerToggleController('#toggleLotView', '#lotViewText', 'Vacant Lot');
    App.controllers.lotViewResidential = new MarkerToggleController('#toggleResidential', '#textResidential', 'Residential');
    App.controllers.lotViewBCM = new MarkerToggleController('#toggleBCM', '#textBCM', 'Business/Commercial/Manufacturing');
    App.controllers.lotViewPOS = new MarkerToggleController('#togglePOS', '#textPOS', 'Parks and Open Space');
    App.controllers.lotViewPD = new MarkerToggleController('#togglePD', '#textPD', 'Planned Manufacturing Districts and Development');

    App.controllers.comparisonArea = new ComparisonAreaController('#legend #comparison-area #selection-area','#legend #comparison-area #graph-area');
    App.controllers.legendAreaView = new LegendAreaViewController();
    /* eslint-enable no-undef */

    App.controllers.mapData.setupDataPanel('#mapPanelToggle', '#mapSettingsPanel');
    App.controllers.mapData.attachResetOverlayButton('#resetMaps');
    App.controllers.mapData.setChartList(App.views.chartList);
    App.controllers.mapData.setComparisonController(App.controllers.comparisonArea);

    App.controllers.search.attachDOMElements('#searchInput', '#searchButton');

    App.views.loadingMessage.updateAndRaise('Loading location, service, and census data');
    let numFinished = 0;
    let serviceTaxonomyP = App.models.serviceTaxonomy.loadData('./data/serviceTaxonomy.json')
      .then((data) => {
        console.info('Loaded Service Taxonomy', ++numFinished);
        return data;
      });
    let boundaryDataP = App.models.boundaryData.loadData()
      .then((data) => {
        console.info('Loaded Boundary Data', ++numFinished);
        return data;
      });
    let censusDataP = App.models.censusData.loadData()
      .then(function (data) {
        // let overlayData = data[0];
        let overlayCategories = data[1];

        App.controllers.mapData.populateDropdown(overlayCategories, max_subdropdown_height);

        console.info('Loaded Census Data', ++numFinished);
        return data;
      });
    let landInventoryP = App.models.landInventory.loadData()
      .then((data) => {
        console.info('Loaded Land Inventory Data', ++numFinished);
        return data;
      });
    let schoolDataP = App.models.schoolData.loadData('./data/18-02-12 Rev Englewood Schools.csv')
      .then(data => {
        console.info('Loaded School Data', ++numFinished);
        return data;
      });
    // let crimeDataP = App.models.crimeData.loadData()
    //   .then((data) => {
    //     console.info("Loaded Crime Data");
    //     return data;
    //   });

    App.controllers.mapData.setCensusClearButton();

    // load other data sources when asked to plot
    let max_subdropdown_height = d3.select('body').node().clientHeight * 0.4;

    console.time('load data');
    Promise.all([serviceTaxonomyP, boundaryDataP, censusDataP, landInventoryP, schoolDataP])
      .then(() => {
        return App.models.serviceData.loadData('admin-data/EnglewoodLocations.csv')
          .then((data) => {
            console.info('Loaded Social Services', ++numFinished);
            return data;
          });
      })
      .then(function() {
        // App.views.map.createMap();
        console.timeEnd('load data');

        checkServicesWithoutCategory();

        console.time('plotting data');
        App.views.loadingMessage.updateAndRaise('Plotting services and lots');
        App.views.map.plotServices(App.models.serviceData.getData());
        App.views.map.plotLandInventory(App.models.landInventory.getDataByFilter());
        App.views.map.plotSchools(App.models.schoolData.getData());

        const markerStates = {
          lotViewResidential: true,
          lotViewBCM: true,
          lotViewPOS: true,
          lotViewPD: true,
        };
        App.controllers.lotTypeMarkerView.setCustomToggleFunction((context) => {
          const showMarkers = context.visibleMarkers;
          const button = d3.select('#lot-type-toggle-group');
          for(const group in markerStates){
            const controller = App.controllers[group];
            if(showMarkers) {
              controller.setVisibilityState(markerStates[group]);
            } else { // hide markers
              markerStates[group] = controller.markersAreVisible();
              controller.setVisibilityState(false);
            }
          }

          button.style('display', showMarkers ? null : 'none');

          if (showMarkers) {
            addLotPixelGlyphs();
          } else {
            try {
              App.views.chartList.removeChart('pixel-englewood');
              App.views.chartList.removeChart('pixel-west-englewood');
            // eslint-disable-next-line no-empty
            } catch (e) { }

          }
        });

        // prevent closing of dropdown
        Object.keys(markerStates).forEach(type => {
          const controller = App.controllers[type];
          controller.setCustomToggleFunction((context, event, next) => {
            if(event){
              event.preventDefault();
              event.stopPropagation();
            }
            next();
          });
        });

        // App.views.chartList...
        console.timeEnd('plotting data');

        console.time('populating dropdown');
        App.controllers.serviceFilterDropdown.populateDropdown(max_subdropdown_height);
        console.timeEnd('populating dropdown');

        //start off with markers hidden
        console.time('setting marker visibility');
        App.controllers.serviceMarkerView.setVisibilityState(false); 
        App.controllers.schoolMarkerView.setVisibilityState(false);
        App.controllers.lotTypeMarkerView.setVisibilityState(false);
        console.timeEnd('setting marker visibility');

        //set two selections to be west englewood and englewood
        console.time('getting selection data');
        App.views.loadingMessage.updateAndRaise('Filtering data for West Englewood and Englewood');
        aggregateData();
        console.timeEnd('getting selection data');
        console.debug(App.models.aggregateData);

        App.controllers.mapData.initializeCustomCharts();

        App.views.loadingMessage.updateAndRaise('Adding charts');

        App.controllers.legendAreaView.attachLegend('#legend #svgLegend', '#legend #legend-collapse-btn');
        App.controllers.legendAreaView.attachComparisonArea('#legend #comparison-area', '#legend #comparison-collapse-btn');

        const legendWidth = d3.select('#legend #svgLegend').attr('width');
        d3.select('#legend #comparison-area').style('max-width', `${legendWidth}px`);
        d3.select('#legend').style('max-width', `${legendWidth}px`);

        const clearButton = App.controllers.comparisonArea.addMainEntry('<b>Clear Graph</b>', 'clear-graph-btn', () => {
          console.debug('clicked clear graph button');
          App.controllers.comparisonArea.setActiveSubId();
          App.controllers.comparisonArea.resetGraphArea();
        });
        clearButton.selectionArea.select('button#main-header').classed('btn-default', true);
        App.controllers.comparisonArea.resetGraphArea();
        addLotPixelGlyphsToComparisonArea();
        // App.views.chartList.addChart(new VacantLotBarChart(App.models.aggregateData.englewood,App.models.aggregateData.westEnglewood));
        // App.views.chartList.updateChart("vacant-lots-total");
        
        // addOverallLotKiviatChart();
        // addRelativeKiviatChart();
        // addLotPixelGlyphs();

        App.insertIcons();

        App.views.chartList.toggleChartListView(false);

        App.views.loadingMessage.finishLoading();

        App.controllers.browserMessage.runBrowserCheck();
      })
      .catch(function(err) {
        console.error(err);
        try{
          App.views.loadingMessage.updateAndRaise('Encountered an error.<br>Please try reloading or contact technical support.');
        }catch(loadingError){
          console.error('Error showing loading message:',loadingError);
        }
        
      });
  };

  App.insertIcons = function(){
    // insert icons
    d3.selectAll('.svg-insert').html(function () {
      let id = d3.select(this).attr('id');
      console.debug('svg id', id);
      if (!id) {
        return '';
      } else {
        return (
          App.views.map.getSmallIcon(id) || 
          (new L.DivIcon.SVGIcon({
            color: App.views.map.getIconColor(id) || 'black',
            fillOpacity: 1,
            iconSize: [14, 23],
          }))
        ).options.html;
      }
    }).classed('svg-insert', false).classed('svg-inserted', true);
  };

  function generateLotKiviatData(lotData, doGenerateRange) {
    let data = {
      Residential: [],
      PD: [],
      POS: [],
      BCM: []
    };
    let total = lotData.length;

    lotData.forEach(d => {
      let zoneType = App.models.landInventory.getZoneClassification(d);
      if(zoneType !== 'Other'){
        data[zoneType].push(d);
      }else{
        console.debug('Ignoring zone', zoneType);
      }
    });

    let filteredData = {};
    let zoneRanges = {};

    for (let zoneType in data) {
      filteredData[zoneType] = data[zoneType].length;
      zoneRanges[zoneType] = [0, total];
    }

    return doGenerateRange ? [filteredData, zoneRanges] : filteredData;
  }

  function addLotPixelGlyphs() {
    let [lotData, lotRanges] = generateLotKiviatData(App.models.landInventory.getDataByFilter(), true);

    for(let type in lotRanges){
      lotRanges[type] = lotRanges[type][1];
    }

    let englewoodKiviatData = generateLotKiviatData(App.models.aggregateData.englewood.data.lot, false);
    let westEnglewoodKiviatData = generateLotKiviatData(App.models.aggregateData.westEnglewood.data.lot, false);

    let plotOptions = {
      init: (panel) => {
        // setup custom toggle button
        let heading = panel.select('.panel-heading').classed('collapsible', true);

        panel.select('.panel-body').classed('collapse', true);
        panel.select('.panel-footer').classed('collapse', true);

        let isClosed = false;

        let toggle = () => {
          $(panel.node()).find('.collapse').collapse(isClosed ? 'show' : 'hide');

          heading.classed('collapsed', !isClosed);
          isClosed = !isClosed;
        };

        heading.on('click', toggle);
        toggle(); toggle();
      }
    };

    console.debug(englewoodKiviatData,westEnglewoodKiviatData, lotRanges);
    // eslint-disable-next-line no-undef
    App.views.chartList.addChart(new VacantLotPixelGlyph('pixel-englewood', '<h4><b>Vacant Lots: <span class=\'text englewood\'>Englewood</span></b></h4>',lotData, plotOptions));
    App.views.chartList.updateChart('pixel-englewood', englewoodKiviatData);

    // eslint-disable-next-line no-undef
    App.views.chartList.addChart(new VacantLotPixelGlyph('pixel-west-englewood', '<h4><b>Vacant Lots: <span class=\'text west-englewood\'>West Englewood</span></b></h4>', lotData, plotOptions));
    App.views.chartList.updateChart('pixel-west-englewood', westEnglewoodKiviatData);
  }

  function addLotPixelGlyphsToComparisonArea() {
    let [lotData, lotRanges] = generateLotKiviatData(App.models.landInventory.getDataByFilter(), true);

    for (let type in lotRanges) {
      lotRanges[type] = lotRanges[type][1];
    }

    let englewoodKiviatData = generateLotKiviatData(App.models.aggregateData.englewood.data.lot, false);
    let westEnglewoodKiviatData = generateLotKiviatData(App.models.aggregateData.westEnglewood.data.lot, false);

    const plotOptions = {
      chartMargins: {
        top: 5,
        bottom: 5,
        left: 50,
        right: 0
      },
      // width: 225
      width: 350
    };

    const vacantLotsCategory = 'ca--vacant-lots';
    const vacantLotsSelectionItem = App.controllers.comparisonArea.addMainEntry(
      '<span class="glyphicon glyphicon-chevron-down"></span> <b>Vacant Lots</b>',
      vacantLotsCategory);
    const westEnglewoodSelectionItem = App.controllers.comparisonArea.addSubEntry(vacantLotsCategory, 'West Englewood', `${vacantLotsCategory}--we`, (mainId, id, graphArea) => {
      console.debug('clicked west englewood button');
      App.controllers.comparisonArea.setActiveSubId(vacantLotsCategory, `${vacantLotsCategory}--we`);
      graphArea.selectAll('*').remove();
      graphArea.append('div').classed('panel-footer', true)
        .append('div').classed('panel-body', true);
      // eslint-disable-next-line no-undef
      const graph = new VacantLotPixelGlyph('pixel-west-englewood', '<h4><b>Vacant Lots: <span class=\'text west-englewood\'>West Englewood</span></b></h4>', lotData, plotOptions);
      graph.init(graphArea);
      graph.update(graphArea, westEnglewoodKiviatData);
    });
    const englewoodSelectionItem = App.controllers.comparisonArea.addSubEntry(vacantLotsCategory, 'Englewood', `${vacantLotsCategory}--e`, (mainId, id, graphArea) => {
      console.debug('clicked englewood button');
      App.controllers.comparisonArea.setActiveSubId(vacantLotsCategory, `${vacantLotsCategory}--e`);
      graphArea.selectAll('*').remove();
      graphArea.append('div').classed('panel-footer', true)
        .append('div').classed('panel-body', true);
      // eslint-disable-next-line no-undef
      const graph = new VacantLotPixelGlyph('pixel-englewood', '<h4><b>Vacant Lots: <span class=\'text englewood\'>Englewood</span></b></h4>', lotData, plotOptions);
      graph.init(graphArea);
      graph.update(graphArea, englewoodKiviatData);
      // graphArea.append('h1').text('Englewood Vacant Lot data goes here');
    });

    vacantLotsSelectionItem.selectionArea.select('button#main-header').classed('btn-default', true);
    westEnglewoodSelectionItem.selectionArea.classed('west-englewood btn btn-block', true);
    englewoodSelectionItem.selectionArea.classed('englewood btn btn-block', true);
  }

  // eslint-disable-next-line no-unused-vars
  function addRelativeKiviatChart() {
    let lotData = generateLotKiviatData(App.models.landInventory.getDataByFilter(), false);
    let lotRanges = {};
    // generate range
    for(let zoneType in lotData){
      lotRanges[zoneType] = [0, lotData[zoneType]];
    }

    let englewoodKiviatData = generateLotKiviatData(App.models.aggregateData.englewood.data.lot, false);
    let westEnglewoodKiviatData = generateLotKiviatData(App.models.aggregateData.westEnglewood.data.lot, false);

    let plotOptions = {
      init: (panel) => {
        // setup custom toggle button
        let heading = panel.select('.panel-heading').classed('collapsible',true);

        panel.select('.panel-body').classed('collapse', true);
        panel.select('.panel-footer').classed('collapse', true);

        let isClosed = false;

        let toggle = () => {
          $(panel.node()).find('.collapse').collapse(isClosed ? 'show' : 'hide');

          heading.classed('collapsed', !isClosed);
          isClosed = !isClosed;
        };
          
        heading.on('click', toggle);
        toggle(); toggle();
      }
    };
    // eslint-disable-next-line no-undef
    App.views.chartList.addChart(new VacantLotStarPlot('vacant-lot-relative-star-plot', '<h4><b>Vacant Lots:</b> Relative Distribution</h4>', lotRanges, plotOptions));
    App.views.chartList.updateChart('vacant-lot-relative-star-plot', {}, { renderLabels: true }); // init labels and outline
    App.views.chartList.updateChart('vacant-lot-relative-star-plot', englewoodKiviatData, { groupID: 'englewood', fillColor: App.models.aggregateData.englewood.color });
    App.views.chartList.updateChart('vacant-lot-relative-star-plot', westEnglewoodKiviatData,
      {
        groupID: 'westEnglewood',
        fillColor: App.models.aggregateData.westEnglewood.color,
        enableInteraction: true,
        htmlFn: (d, propertyMap) => {
          let totalPercent = (lotData[d.key] / App.models.landInventory.getDataByFilter().length) * 100,
            englewoodPercent = (englewoodKiviatData[d.key] / lotRanges[d.key][1]) * 100,
            westEnglewoodPercent = (westEnglewoodKiviatData[d.key] / lotRanges[d.key][1]) * 100;

          return `<b><u>${propertyMap[d.key]}:</u></b><br>
                    <b>Overall:</b> ${lotData[d.key]} (${totalPercent.toFixed(2)}%) of ${App.models.landInventory.getDataByFilter().length} total lots<br>
                    <b class="text englewood">Englewood:</b> ${englewoodKiviatData[d.key]} (${englewoodPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} lots<br>
                    <b class="text west-englewood">West Englewood:</b> ${westEnglewoodKiviatData[d.key]} (${westEnglewoodPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} lots
                  `;
        },
      });
  }

  // eslint-disable-next-line no-unused-vars
  function addOverallLotKiviatChart() {

    let [lotData, lotRanges] = generateLotKiviatData(App.models.landInventory.getDataByFilter(), true);

    console.debug(lotRanges, lotData);

    let englewoodKiviatData = generateLotKiviatData(App.models.aggregateData.englewood.data.lot, false);
    let westEnglewoodKiviatData = generateLotKiviatData(App.models.aggregateData.westEnglewood.data.lot, false);

    let plotOptions = {
      init: (panel) => { // make panel collapsible
        let heading = panel.select('.panel-heading').classed('collapsible', true);

        panel.select('.panel-body').classed('collapse', true);
        panel.select('.panel-footer').classed('collapse', true);

        let isClosed = false;

        let toggle = () => {
          $(panel.node()).find('.collapse').collapse(isClosed ? 'show' : 'hide');

          heading.classed('collapsed', !isClosed);
          isClosed = !isClosed;
        };

        heading.on('click', toggle);
        toggle(); toggle();
      }
    };

    // eslint-disable-next-line no-undef
    App.views.chartList.addChart(new VacantLotStarPlot('vacant-lot-overall-star-plot', '<h4><b>Vacant Lots:</b> Overall Distribution</h4>', lotRanges, plotOptions));
    App.views.chartList.updateChart('vacant-lot-overall-star-plot', {}, { renderLabels: true }); // init labels and outline
    App.views.chartList.updateChart('vacant-lot-overall-star-plot', lotData, { groupID: 'overall', fillColor: '#e8e031' });
    App.views.chartList.updateChart('vacant-lot-overall-star-plot', englewoodKiviatData, { groupID: 'englewood', fillColor: App.models.aggregateData.englewood.color });
    App.views.chartList.updateChart('vacant-lot-overall-star-plot', westEnglewoodKiviatData,
      {
        groupID: 'westEnglewood',
        fillColor: App.models.aggregateData.westEnglewood.color,
        enableInteraction: true,
        htmlFn: (d, propertyMap) => {
          let totalPercent = (lotData[d.key] / lotRanges[d.key][1]) * 100,
            englewoodPercent = (englewoodKiviatData[d.key] / lotRanges[d.key][1]) * 100,
            westEnglewoodPercent = (westEnglewoodKiviatData[d.key] / lotRanges[d.key][1]) * 100;

          return `<b><u>${propertyMap[d.key]}:</u></b><br>
                    <b style="background-color: rgb(232, 224, 49)">Overall:</b> ${lotData[d.key]} (${totalPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} total lots<br>
                    <b class="text englewood">Englewood:</b> ${englewoodKiviatData[d.key]} (${englewoodPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} total lots<br>
                    <b class="text west-englewood">West Englewood:</b> ${westEnglewoodKiviatData[d.key]} (${westEnglewoodPercent.toFixed(2)}%) of ${lotRanges[d.key][1]} total lots
                  `;
        },
      });
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
        color: '#1f77b4',
        id: 'West Englewood',
        bounds: (function (poly) {
          console.time('bounds get');
          let coordsArr = poly.geometry.coordinates[0];
          let latExtent = d3.extent(coordsArr, d => d[1]);
          let lngExtent = d3.extent(coordsArr, d => d[0]);

          console.timeEnd('bounds get');

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
        color: '#ff7f0e',
        id: 'Englewood',
        bounds: (function (poly) {
          console.time('bounds get');
          let coordsArr = poly.geometry.coordinates[0];
          let latExtent = d3.extent(coordsArr, d => d[1]);
          let lngExtent = d3.extent(coordsArr, d => d[0]);

          console.timeEnd('bounds get');
          return [
            [latExtent[0], lngExtent[0]],
            [latExtent[1], lngExtent[1]],
          ];
        })(englewoodPoly)
      }
    };

    App.models.aggregateData = selectionData;
  }

  function checkServicesWithoutCategory() {
    let serviceTypes = (() => {
      let result = [];
      const tier1Cat = App.models.serviceTaxonomy.getTier1Categories();
      tier1Cat.forEach(category => {
        const code = App.models.serviceTaxonomy.getCategoryCodeOf(category);
        const tier2 = App.models.serviceTaxonomy.getTier2CategoriesOf(category)
          .map(cat2 => `${code}||${cat2}`);
        result = result.concat(tier2);
      });
      return result;
    })();
    let serviceData = App.models.serviceData.getData();

    let filteredData = serviceData.filter(s => {
      // let hasService = false;
      // serviceTypes.forEach((t => {
      //   if(s[t]){
      //     hasService = true;
      //   }
      // }));
      // return !hasService;
      return serviceTypes.filter(t => s[t] == 1).length < 1;
    });

    if(filteredData.length > 0){
      console.info('Services with no categories', filteredData);
    }
  }
})();
