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
  };
  self.views = {
    map: new MapView('service-map', self.models.markerIcons),
    serviceFilterDropdown: new ServiceFilterDropdownView(),
    censusFilterDropdown: new CensusFilterDropdownView(),
    loader,
  };
  self.controllers = {
    serviceFilters: null,
    serviceMarkerView: null,
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

    self.views.censusFilterDropdown.init(self.models.censusData);

    // eslint-disable-next-line no-undef
    self.controllers.serviceFilters = new ServiceFilterController({
      dropdownView: self.views.serviceFilterDropdown,
      mapView: self.views.map,
      serviceModel: self.models.serviceData,
      mapIconModel: self.models.markerIcons,
    });
    self.controllers.serviceFilters.init(self.models.serviceTaxonomy);

    /* eslint-disable no-undef */
    self.controllers.serviceMarkerView = new MarkerViewController(
      '#marker-view-toggle-group #toggle-marker-view--service',
      () => self.views.map.setLayerGroupVisibility(ServiceFilterController.layerGroupName, false),
      () => self.views.map.setLayerGroupVisibility(ServiceFilterController.layerGroupName, true),
    );
    /* eslint-enable no-undef */
    self.controllers.serviceFilters.attachMarkerViewController(self.controllers.serviceMarkerView);
    self.controllers.serviceFilters.updateViews();
    self.models.markerIcons.autoInsertIntoDom();

    setAppContentDivHeight();
    await self.views.map.initMap();

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
