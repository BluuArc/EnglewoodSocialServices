/* global d3 _ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let SocialServiceModel = function() {
  let self = {
    data: null,

    filters: {},
    searchTerm: ''
  };

  init();

  function init() {

  }

  function loadData(dataPath) {
    return App.controllers.dataDownload.getCsv(dataPath)
      .then(function (data) {
        self.data = data;

        //filter out empty entries
        self.data = data.filter(function (d) {
          let isNotEmpty = false;
          for (const property in d) {
            if (typeof d[property] === 'string' && d[property].length > 0) {
              isNotEmpty = true;
            }
          }
          return isNotEmpty;
        });
        return;
      });
  }

  function getData() {
    return self.data;
  }

  function getFilteredData(serviceFilters) {
    self.filters = serviceFilters;
    return getSearchAndFilterSubset();
  }

  // just searching by name for now
  function getSearchedData(term) {
    self.searchTerm = _.lowerCase(term);
    return getSearchAndFilterSubset();
  }

  function getSearchAndFilterSubset() {
    let filteredData = Object.keys(self.filters).length == 0 ? self.data :
      _.filter(self.data, function(el) {
        for (let property of Object.keys(self.filters)) {
          if (el[property] == 1) {
            return true;
          }
        }
        return false;
      });

    let searchData = self.searchTerm.length === 0 ? self.data :
      _.filter(self.data, el => _.includes(_.lowerCase(el['Organization Name']), self.searchTerm));

    return _.intersection(filteredData, searchData);

  }

  function getDataByFilter(filterFn){
    return _.filter(self.data,filterFn);
  }

  function getDataWithinBounds(bounds) {
    const lat = d3.extent(bounds, b => b.lat);
    const lng = d3.extent(bounds, b => b.lng);

    return getDataByFilter((service) => {
      const serviceLat = +service.Latitude, serviceLng = +service.Longitude;
      return (serviceLat >= lat[0] && serviceLat < lat[1]) &&
        (serviceLng >= lng[0] && serviceLng < lng[1]);
    });
  }

  return {
    loadData,
    getData,
    getFilteredData,
    getSearchedData,
    getDataWithinBounds,
    getDataByFilter
  };
};
