/* global $ less */
'use strict';

function wait (time = 500, isMock = false) {
  if (isMock) {
    console.warn('mocking wait of time in ms:', time);
  }
  return new Promise(resolve => setTimeout(resolve, time));
}

function AnalyticsApp () {
  const self = this;

  /* eslint-disable no-undef */
  self.models = {
    serviceData: new SocialServiceModel('admin-data/EnglewoodLocations.csv'),
    markerIcons: new MapIconModel(),
    serviceTaxonomy: new ServiceTaxonomyModel('./data/serviceTaxonomy.json'),
  };
  self.views = {
    map: new MapView('service-map', self.models.markerIcons),
  };
  self.controllers = {
    serviceFilterDropdown: new ServiceFilterDropdownController(),
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
    
    // eslint-disable-next-line no-undef
    const loadingView = new LoadingMessageView();
    loadingView.mainMessage = 'Downloading Data';
    await self.models.serviceData.load();
    await self.models.serviceTaxonomy.load();

    loadingView.mainMessage = 'Initializing Application';
    self.controllers.serviceFilterDropdown.init(self.models.serviceTaxonomy);
    self.models.markerIcons.autoInsertIntoDom();
    setAppContentDivHeight();
    await self.views.map.initMap();

    await wait(500, true);

    loadingView.mainMessage = 'Done!';
    loadingView.subMessage = '';
    await loadingView.hideMessage();
    console.timeEnd('app init');
  };
}

let App;
(() => {
  console.debug('waiting for page to load');
  const documentLoadP = new Promise(resolve => $(document).ready(resolve));
  const windowLoadP = new Promise(resolve => $(window).on('load', resolve));
  const lessCssLoadedP = less.pageLoadFinished;

  Promise.all([documentLoadP, windowLoadP, lessCssLoadedP])
    .then(() => {
      console.debug('page loaded');
      return wait();
    }).then(() => {
      App = new AnalyticsApp();
      return App.init();
    }).catch(console.error);
})();
