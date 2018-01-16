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

window.onresize = function() {
  for (let view of Object.values(App.views)) {
    if (view.resize) {
      view.resize();
    }
  }
};

(function() {
  App.models = {};
  App.views = {};
  App.controllers = {};

  // models
  App.models.socialServices = new SocialServiceModel();
  App.models.serviceTaxonomy = new ServiceTaxonomyModel();
  App.models.schoolData = new SchoolDataModel();

  // views


  // controllers
  App.controllers.serviceFilterDropdown = new FilterDropdownController();
  App.controllers.listToMapLink = new ListToMapLinkingController();
  App.controllers.locationButton = new LocationButtonController();
  App.controllers.search = new SearchController();

  App.init = function() {
    $('[data-toggle="popover"]').popover(); //needed for tooltip on landing page
    App.views.loadingMessage = new LoadingMessageView("#loading-indicator");

    App.views.browserMessage = new BrowserMessageView("#browserModal");
    App.models.browser = new BrowserModel();
    App.controllers.browserMessage = new BrowserMessageController();

    console.log("Loading Finder");
    App.views.loadingMessage.startLoading("Loading Map");
    App.views.map = new MapView("serviceMap");
    App.views.serviceList = new ServiceListView("#serviceList");
    App.views.serviceList.makeCollapsing("#toggleHideServicesButton", "#serviceListWrapper");

    App.views.loadingMessage.updateAndRaise("Initializing buttons and interface elements");
    App.controllers.serviceFilterDropdown.setFilterDropdown("#filterDropdownList", "#filterDropdownButton");
    App.controllers.serviceFilterDropdown.attachAllServicesButton("#allServicesButton");

    App.controllers.locationButton.attachLocationButton("#locationButton");
    App.controllers.locationButton.attachAddressLookupButton("#findAddressButton");
    App.controllers.locationButton.attachSearchInput();

    App.controllers.search.attachDOMElements("#searchInput", "#searchCount", "#searchButton");

    App.controllers.schoolMarkerView = new LeafletMarkerViewController("#toggleSchoolView", "#schoolViewText", "School");

    App.views.loadingMessage.updateAndRaise("Loading location and service data");
    let socialServiceP = App.models.socialServices.loadData("./admin-data/EnglewoodLocations.csv")
    let serviceTaxonomyP = App.models.serviceTaxonomy.loadData("./data/serviceTaxonomy.json");
    let schoolDataP = App.models.schoolData.loadData("./data/17-12-05 Englewood Schools.csv");

    App.controllers.modal = new modalController();

    Promise.all([socialServiceP, serviceTaxonomyP, schoolDataP])
      .then(function(values) {
        // App.views.map.createMap();

        App.views.loadingMessage.updateAndRaise("Plotting services");
        App.views.map.plotServices(App.models.socialServices.getData());
        App.views.serviceList.populateList(App.models.socialServices.getData());
        App.views.map.plotSchools(App.models.schoolData.getData());

        App.controllers.search.setCount(App.models.socialServices.getData().length);
        App.controllers.modal.setCount(App.models.socialServices.getData().length);

        let max_subdropdown_height = d3.select('body').node().clientHeight * 0.4;
        App.controllers.serviceFilterDropdown.populateDropdown(max_subdropdown_height);

        App.views.loadingMessage.finishLoading();

        App.controllers.browserMessage.runBrowserCheck();
      })
      .catch(function(err) {
        console.log(err);
      });
  };

})();
