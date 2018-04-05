/* global d3 _ $ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let modalController = function () {
  let self = {
    modal: null,
    body: null,
    acceptButton: null,
    orgSearchInput: null,
    counter: null,
    addressInput: null,
    backButton: null
  };

  function initalize() {

    self.modal = d3.select('#landing-page');
    self.body = self.modal.select('.modal-body');

    self.acceptButton = self.modal.select('#modalAcceptButton')
      .on('click', acceptButtonClicked);


    self.orgSearchInput = d3.selectAll('#modalSearchInput')
      .on('input', onInput)
      .on('keyup', function () {
        if (d3.event.keyCode == 13) {
          console.debug('enter!');
          // hitting enter in the input is equivalent to pressing accept button
          acceptButtonClicked();
        }
      });

    self.addressInput = d3.select('#modalAddressInput')
      .on('input', changeButtonState)
      .on('keyup', function () {
        if (d3.event.keyCode == 13) {
          console.debug('enter!');
          // hitting enter in the input is equivalent to pressing accept button
          acceptButtonClicked();
        }
      });

    self.counter = d3.selectAll('#modalSearchCount');

    self.backButton = d3.selectAll('#backToSearchButton')
      .on('click', function () {
        App.controllers.serviceFilterDropdown.resetFilters();
        self.orgSearchInput.node().value = '';
        self.addressInput.node().value = '';
        changeButtonState();
        onInput();

      });

    d3.selectAll('#pageTitle')
      .on('click', function () {
        App.controllers.serviceFilterDropdown.resetFilters();
        self.orgSearchInput.node().value = '';
        self.addressInput.node().value = '';
        changeButtonState();
        onInput();

      });

  }

  function setCount(count) {
    self.counter.html(count);
  }

  function onInput() {
    let searchTerm = _.lowerCase(self.orgSearchInput.node().value);

    let searchData = App.models.serviceData.getSearchedData(searchTerm);

    countChanged(searchData);

    changeButtonState();
  }

  function countChanged(data) {
    // get number of elements in search
    self.counter.html(data.length);

    if (data.length === 0) {
      self.counter.classed('searchCountEmpty', true);
      d3.select(self.counter.node().parentNode).classed('searchCountEmpty', true);
    } else {
      self.counter.classed('searchCountEmpty', false);
      d3.select(self.counter.node().parentNode).classed('searchCountEmpty', false);
    }
  }

  function changeButtonState() {
    let orgSearchText = self.orgSearchInput.node().value;

    let searchTerm = _.lowerCase(orgSearchText);

    // let searchData = App.models.serviceData.getSearchedData(searchTerm);

    var address = self.addressInput.node().value;

    var service = document.getElementById('currentServiceSelection').innerHTML;
    if (searchTerm.length != 0 || address.length != 0 || !service.includes('Select Services...')) {
      $('#modalAcceptButton').removeClass('disabled');
    } else {
      $('#modalAcceptButton').addClass('disabled');
    }
  }

  function acceptButtonClicked() {

    let orgSearchText = self.orgSearchInput.node().value;

    let searchTerm = _.lowerCase(orgSearchText);

    let searchData = App.models.serviceData.getSearchedData(searchTerm);

    var address = self.addressInput.node().value;

    var service = d3.select('#currentServiceSelection').text();

    // var service = document.getElementById("currentServiceSelection").innerHTML;
    //make sure at least one option is chosen
    console.debug(service);
    if (searchTerm.length == 0 && address.length == 0 && service.includes('Select Services...')) {
      console.warn('its empty!!');
    } else {
      if (address.length !== 0) {
        App.controllers.locationButton.getLatLngFromAddress(address, function(pos) {
          App.views.map.fitMapAroundServices(pos);
        });

        
      } else if (address.length == 0) {

        // var data = App.models.serviceData.getData();

        //to center on default location
        // App.views.map.clearLocation();

        //code to center on first location in list
        if (searchData && searchData[0] && searchData[0].Longitude != null && searchData[0].Latitude != null) {
          // jump to first services
          // App.views.map.jumpToLocationNoMarker({
          //   lat: searchData[0].Y,
          //   lng: searchData[0].X
          // });

          // fit map around all services
          App.views.map.fitMapAroundServices();
        } else {
          App.views.map.clearLocation();
        }

      }

      App.views.map.updateServicesWithFilter(searchData);
      App.views.serviceList.populateList(searchData, {search: searchTerm, address, service});

      App.controllers.search.countChanged(searchData);
      $('#landing-page').modal('hide');

    }

  }

  initalize();

  return {
    setCount,
    countChanged,
    changeButtonState
  };
};
