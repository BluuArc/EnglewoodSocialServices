/* global $ less LoadingMessageView */
'use strict';

function wait (time = 500, isMock = false) {
  if (isMock) {
    console.warn('mocking wait of time in ms:', time);
  }
  return new Promise(resolve => setTimeout(resolve, time));
}

function AnalyticsApp (loader = new LoadingMessageView()) {
  const self = this;

  /* eslint-disable no-undef */
  self.models = {
    serviceData: new SocialServiceModel('admin-data/EnglewoodLocations.csv'),
    markerIcons: new MapIconModel(),
    serviceTaxonomy: new ServiceTaxonomyModel('./data/serviceTaxonomy.json'),
    censusData: new CensusDataModel('./data/censusDataBlocks.geojson', './data/censusDataNames.json'),
    schoolData: new SchoolDataModel('./data/18-02-12 Rev Englewood Schools.csv'),
    lotData: new LotDataModel('./data/EnglewoodLandInventory.csv', './data/WestEnglewoodLandInventory.csv'),
  };
  self.views = {
    map: new MapView('service-map', self.models.markerIcons),
    serviceFilterDropdown: new ServiceFilterDropdownView(),
    censusFilterDropdown: new CensusFilterDropdownView(),
    loader,
    legend: new LegendView(
      '#legend #legend--collapse-btn',
      '#legend--collapse-svg-container',
      self.models.markerIcons,
    ),
  };
  self.controllers = {
    serviceFilters: null,
    serviceMarkerView: null,
    censusFilters: null,
    schoolView: null,
    schoolMarkerView: null,
    lotView: null,
  };
  /* eslint-enable no-undef */

  function setAppContentDivHeight () {
    const container = document.querySelector('.app-content');
    const toolbar = document.querySelector('body>nav.navbar.navbar-default');
    container.style.height = `calc(100% - ${toolbar.offsetHeight}px)`;
  }

  self.init = async function () {
    console.time('app init');
    console.debug('Starting app init');

    const loadingView = self.views.loader;
    await self._initData();

    loadingView.mainMessage = 'Initializing UI';
    loadingView.subMessage = 'Please wait';
    self._initViewControllers();
    
    self.models.markerIcons.autoInsertIntoDom();
    setAppContentDivHeight();
    await self.views.map.initMap();
    self.controllers.serviceFilters.updateViews();
    self.controllers.censusFilters.updateViews();
    self.controllers.serviceMarkerView.toggle(false);
    self.controllers.lotMarkerView.toggle(false);

    loadingView.mainMessage = 'Done!';
    loadingView.subMessage = '';
    await loadingView.hideMessage();
    console.timeEnd('app init');
  };

  self._initData = async function () {
    self.views.loader.mainMessage = 'Downloading Data';
    self.views.loader.subMessage = 'Loading Service Data';
    await self.models.serviceTaxonomy.load();
    await self.models.serviceData.load(undefined, self.models.serviceTaxonomy);

    self.views.loader.subMessage = 'Loading Census Data';
    await self.models.censusData.load();

    self.views.loader.subMessage = 'Loading School Data';
    await self.models.schoolData.load();
    self.models.schoolData.markSchoolsThatAreServices(self.models.serviceData);

    self.views.loader.subMessage = 'Loading Lot Data';
    await self.models.lotData.load();
  };

  self._initViewControllers = function () {
    /* eslint-disable no-undef */
    self.controllers.serviceFilters = new ServiceFilterController({
      dropdownView: self.views.serviceFilterDropdown,
      mapView: self.views.map,
      serviceModel: self.models.serviceData,
      mapIconModel: self.models.markerIcons,
    });
    self.controllers.serviceFilters.init(self.models.serviceTaxonomy);

    self.controllers.censusFilters = new CensusFilterController({
      dropdownView: self.views.censusFilterDropdown,
      mapView: self.views.map,
      censusModel: self.models.censusData,
      legendView: self.views.legend,
    });
    self.controllers.censusFilters.init();

    self.controllers.serviceMarkerView = new MarkerViewController(
      '#marker-view-toggle-group #toggle-marker-view--service',
      () => self.views.map.setLayerGroupVisibility(ServiceFilterController.layerGroupName, false),
      () => self.views.map.setLayerGroupVisibility(ServiceFilterController.layerGroupName, true),
    );
    self.controllers.serviceFilters.attachMarkerViewController(self.controllers.serviceMarkerView);

    self.controllers.schoolView = new SchoolViewController({
      mapView: self.views.map,
      schoolModel: self.models.schoolData,
      mapIconModel: self.models.markerIcons,
      serviceModel: self.models.serviceData,
    });
    self.controllers.schoolMarkerView = new MarkerViewController(
      '#marker-view-toggle-group #toggle-marker-view--school',
      () => self.views.map.setLayerGroupVisibility(SchoolViewController.layerGroupName, false),
      () => self.views.map.setLayerGroupVisibility(SchoolViewController.layerGroupName, true),
    );
    self.controllers.schoolView.init(self.controllers.schoolMarkerView);

    self.controllers.lotView = new LotViewController({
      mapView: self.views.map,
      lotModel: self.models.lotData,
      mapIconModel: self.models.markerIcons,
      lotMarkerTypeDropdownSelector: '#lot-type-view-toggle-group',
    });
    self.controllers.lotMarkerView = new MarkerViewController(
      '#marker-view-toggle-group #toggle-marker-view--lot',
      () => self.views.map.setClusterGroupVisibility(LotViewController.layerGroupName, false),
      () => self.views.map.setClusterGroupVisibility(LotViewController.layerGroupName, true),
    );
    const lotTypeMarkerViews = {};
    self.models.lotData.lotTypes.forEach(type => {
      lotTypeMarkerViews[type] = new MarkerViewController(
        `#lot-type-view-toggle-group #toggle-lot-marker--${type.toLowerCase()}`,
        () => self.views.map.setClusterSubGroupVisibility(LotViewController.layerGroupName, type, false),
        () => self.views.map.setClusterSubGroupVisibility(LotViewController.layerGroupName, type, true),
      );
    });
    self.controllers.lotView.init(self.controllers.lotMarkerView, lotTypeMarkerViews);
    /* eslint-enable no-undef */
  };
}

let App;
(() => {
  console.debug('waiting for page to load');
  const documentLoadP = new Promise(resolve => $(document).ready(resolve));
  const windowLoadP = new Promise(resolve => $(window).on('load', resolve));
  const lessCssLoadedP = less.pageLoadFinished;
  
  let loader;
  Promise.all([documentLoadP, windowLoadP, lessCssLoadedP])
    .then(() => {
      console.debug('page loaded');
      return wait();
    }).then(() => {
      loader = new LoadingMessageView();
      App = new AnalyticsApp(loader);
      return App.init();
    }).catch(err => {
      console.error(err);
      if (loader) {
        loader.mainMessage = 'An error has occurred';
        loader.subMessage = 'Please try refreshing the page or contacting the administrator';
      }
    });
})();
