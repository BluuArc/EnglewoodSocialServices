/* global d3 _ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let LandInventoryModel = function () {
  let self = {
    data: null,
    splitData: {
      englewood: [],
      westEnglewood: []
    }
  };

  function loadCSV(path) {
    return new Promise(function (fulfill, reject) {
      d3.csv(path, function (error, csv) {
        if (error) reject(error);

        fulfill(csv);
      });
    });
  }

  // eslint-disable-next-line no-unused-vars
  function loadJSON(path) {
    return new Promise(function (fulfill, reject) {
      d3.json(path, function (error, json) {
        if (error) reject(error);

        console.info(json.length);
        fulfill(json);
      });
    });
  }

  function loadData() {
    let englewoodData, westEnglewoodData;
    // let ePromise = loadJSON("./data/EnglewoodLandInventory.json")
    let ePromise = loadCSV('./data/EnglewoodLandInventory.csv')
      .then((data) => {
        englewoodData = data.map((c) => { 
          c.Area = 'Englewood'; 

          //extract coordinates from location field
          let coords = c.Location.slice(c.Location.lastIndexOf('(') + 1).replace(')', '').split(',');
          c.Latitude = coords[0];
          c.Longitude = coords[1];

          return c; 
        });
        return;
      });
    // let wePromise = loadJSON("./data/WestEnglewoodLandInventory.json")
    let wePromise = loadCSV('./data/WestEnglewoodLandInventory.csv')
      .then((data) => {
        westEnglewoodData = data.map((c) => { 
          c.Area = 'West Englewood';
        
          //extract coordinates from location field
          let coords = c.Location.slice(c.Location.lastIndexOf('(') + 1).replace(')', '').split(',');
          c.Latitude = coords[0];
          c.Longitude = coords[1];

          return c;
        });
        return;
      });

    return Promise.all([ePromise, wePromise])
      .then(() => {
        self.splitData.englewood = englewoodData;
        self.splitData.westEnglewood = westEnglewoodData;
        self.data = englewoodData.concat(westEnglewoodData);
        console.debug('Done loading land inventory data');
        console.debug(self);
      });
  }

  function splitDataByEnglewood_WestEnglewood(){
    return self.splitData;
  }

  function getDataByFilter(filterFn) {
    if(!filterFn) return self.data;
    console.time('getDataByFilter');
    let results = _.filter(self.data, filterFn);
    console.timeEnd('getDataByFilter');
    return results;
  }

  function getZoneClassification(lot, isFullName) {
    let zone = lot['Zoning Classification'];
    if (zone.indexOf('R') === 0) {
      return 'Residential';
    } else if (zone.indexOf('PD') === 0 || zone.indexOf('PMD') === 0) {
      return isFullName ? 'Planned Manufacturing Districts and Development' : 'PD';
    } else if (zone.indexOf('POS') === 0) {
      return isFullName ? 'Parks and Open Space' : 'POS';
    } else if (zone.indexOf('B') === 0 || zone.indexOf('C') === 0 || zone.indexOf('M') === 0) {
      return isFullName ? 'Business, Commercial, and Manufacturing' : 'BCM';
    } else {
      return 'Other';
    }
  }

  return {
    loadData,
    getDataByFilter,
    splitDataByEnglewood_WestEnglewood,
    getZoneClassification
  };
};
