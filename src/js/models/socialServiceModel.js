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
        
        //filter out empty entries
        self.data = data.filter((d) => {
          let isNotEmpty = false;
          for(let property in d){
            if(typeof d[property] === "string" && d[property].length > 0){
              isNotEmpty = true;
            }
          }
           
          return isNotEmpty;
        });
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

  function getDataByFilter(filterFn){
    return _.filter(self.data,filterFn);
  }

  function getDataWithinBounds(bounds) {
    let lat = d3.extent(bounds, b => b.lat);
    let lng = d3.extent(bounds, b => b.lng);

    // return _.filter(self.data, service => service.Y >= lat[0] && service.Y < lat[1] && service.X >= lng[0] && service.X < lng[1]);
    return getDataByFilter((service) => {
      let serviceLat = +service.Latitude, serviceLng = +service.Longitude;
      return serviceLat >= lat[0] && serviceLat < lat[1] && serviceLng >= lng[0] && serviceLng < lng[1];
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
