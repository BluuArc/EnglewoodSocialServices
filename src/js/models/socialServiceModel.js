"use strict";

var App = App || {};

let SocialServiceModel = function() {
  let self = {
    data: null,

    filters: {},
    searchTerm: ""
  };

  init();

  function init() {

  }

  function loadData(dataPath) {
    return new Promise(function(resolve, reject) {
      d3.csv(dataPath, function(err, data) {
        if (err) reject(err);

        self.data = data;
        resolve();
      })
    });
  }

  function getData() {
    return self.data;
  }

  function getFilteredData(serviceFilters) {
    self.filters = serviceFilters;
    // if (Object.keys(serviceFilters).length == 0) {
    //   return self.data;
    // }
    //
    // return _.filter(self.data, function(el) {
    //   for (let property of Object.keys(serviceFilters)) {
    //     if (el[property] == 1) {
    //       return true;
    //     }
    //   }
    //
    //   return false;
    // });

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
      _.filter(self.data, el => _.includes(_.lowerCase(el["Organization Name"]), self.searchTerm));

    return _.intersection(filteredData, searchData);

  }

  function getDataWithinBounds(bounds) {
    return _.filter(self.data, service => service.Y < bounds[0].lat && service.Y >= bounds[1].lat && service.X < bounds[1].lng && service.X >= bounds[0].lng);
  }

  return {
    loadData,
    getData,
    getFilteredData,
    getSearchedData,
    getDataWithinBounds
  };
};
