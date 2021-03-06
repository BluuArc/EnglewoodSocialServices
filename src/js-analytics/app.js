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
    lotData: new LotDataModel('./api/vacant-lots'),
    crimeData: new CrimeDataModel('./api/crimes'),
  };
  self.views = {
    map: new MapView('service-map', self.models.markerIcons),
    serviceFilterDropdown: new ServiceFilterDropdownView({
      buttonGroup: '#main-marker-dropdown #map-markers-dropdown--services',
      dropdownMenu: '#main-marker-dropdown #map-markers-dropdown--services ul.dropdown-menu',
    }),
    censusFilterDropdown: new CensusFilterDropdownView(),
    loader,
    legend: new LegendView(
      '#legend #legend--collapse-btn',
      '#legend--collapse-svg-container',
      self.models.markerIcons,
    ),
  };
  self.controllers = {
    dataDownload: new DataDownloadController('https://quahog.evl.uic.edu/'),
    serviceFilters: null,
    serviceMarkerView: null,
    censusFilters: null,
    schoolView: null,
    schoolMarkerView: null,
    lotView: null,
    lotMarkerView: null,
    crimeView: null,
    crimeMarkerView: null,
  };
  window.dataDownloadController = self.controllers.dataDownload;
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
    self.controllers.censusFilters.updateViews();
    self.controllers.serviceFilters.toggleAll(false);
    self.controllers.lotView.updateAllViews(false);
    self.controllers.crimeMarkerView.toggle(false);
    self.controllers.schoolMarkerView.toggle(false);

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

    self.views.loader.subMessage = 'Loading Crime Data';
    await self.models.crimeData.load();
  };

  self._initViewControllers = function () {
    /* eslint-disable no-undef */
    // service and census
    self.views.mainServiceDropdown = new MainMarkerDropdownView('#main-marker-button-group', '#map-markers-dropdown--services');
    self.controllers.serviceFilters = new ServiceFilterController({
      dropdownView: self.views.serviceFilterDropdown,
      mapView: self.views.map,
      serviceModel: self.models.serviceData,
      mapIconModel: self.models.markerIcons,
      mainMarkerDropdownView: self.views.mainServiceDropdown,
    });
    self.controllers.serviceFilters.init(self.models.serviceTaxonomy);

    self.controllers.censusFilters = new CensusFilterController({
      dropdownView: self.views.censusFilterDropdown,
      mapView: self.views.map,
      censusModel: self.models.censusData,
      legendView: self.views.legend,
    });
    self.controllers.censusFilters.init();

    // school
    self.controllers.schoolView = new SchoolViewController({
      mapView: self.views.map,
      schoolModel: self.models.schoolData,
      mapIconModel: self.models.markerIcons,
      serviceModel: self.models.serviceData,
    });
    self.controllers.schoolMarkerView = new MarkerViewController(
      '#main-marker-dropdown #toggle-marker-view--school',
      () => self.views.map.setLayerGroupVisibility(SchoolViewController.layerGroupName, false),
      () => self.views.map.setLayerGroupVisibility(SchoolViewController.layerGroupName, true),
      false,
      true,
    );
    self.controllers.schoolView.init(self.controllers.schoolMarkerView);

    // lot
    self.controllers.lotView = new LotViewController({
      mapView: self.views.map,
      lotModel: self.models.lotData,
      mapIconModel: self.models.markerIcons,
    });
    self.controllers.lotMarkerView = new MarkerViewController(
      '#main-marker-dropdown #toggle-marker-view--lot',
      () => self.views.map.setClusterGroupVisibility(LotViewController.layerGroupName, false),
      () => self.views.map.setClusterGroupVisibility(LotViewController.layerGroupName, true),
      false,
      true,
    );
    self.views.lotDropdown = new MainMarkerDropdownView('#main-marker-button-group', '#map-markers-dropdown--lot');
    const lotTypeMarkerViews = {};
    self.models.lotData.lotTypes.forEach(type => {
      lotTypeMarkerViews[type] = new MarkerViewController(
        `#main-marker-dropdown #toggle-lot-marker--${type.toLowerCase()}`,
        () => self.views.map.setClusterSubGroupVisibility(LotViewController.layerGroupName, type, false),
        () => self.views.map.setClusterSubGroupVisibility(LotViewController.layerGroupName, type, true),
        false,
        true,
      );
    });
    self.controllers.lotView.init(self.views.lotDropdown, lotTypeMarkerViews);

    // crime
    self.controllers.crimeView = new CrimeViewController({
      mapView: self.views.map,
      crimeModel: self.models.crimeData,
      mapIconModel: self.models.markerIcons,
    });
    self.controllers.crimeMarkerView = new MarkerViewController(
      '#main-marker-dropdown #toggle-marker-view--crime',
      () => self.views.map.setClusterGroupVisibility(CrimeViewController.layerGroupName, false),
      () => self.views.map.setClusterGroupVisibility(CrimeViewController.layerGroupName, true),
    );
    self.views.crimeDropdown = new MainMarkerDropdownView('#main-marker-button-group', '#map-markers-dropdown--crime');
    self.controllers.crimeView.init(self.views.crimeDropdown);
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
