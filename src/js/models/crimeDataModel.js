"use strict";

var App = App || {};

let CrimeDataModel = function () {
  let self = {
    data: null
  };

  function loadCSV(path) {
    return new Promise(function (fulfill, reject) {
      d3.csv(path, function (error, csv) {
        if (error) reject(error);

        fulfill(csv);
      });
    });
  }

  function loadJSON(path) {
    return new Promise(function (fulfill, reject) {
      d3.json(path, function (error, json) {
        if (error) reject(error);

        fulfill(json);
      });
    });
  }

  function loadData() {
    let englewoodData, westEnglewoodData;
    // let ePromise = loadJSON("./data/Englewood_Crimes_-_2001_to_2016.json")
    let ePromise = loadCSV("./data/Englewood_Crimes_-_2001_to_2016.csv")
      .then((data) => {
        englewoodData = data.map((c) => { c.Area = "Englewood"; return c; });
        return;
      });
    // let wePromise = loadJSON("./data/West_Englewood_Crimes_-_2001_to_2016.json")
    let wePromise = loadCSV("./data/West_Englewood_Crimes_-_2001_to_2016.csv")
      .then((data) => {
        westEnglewoodData = data.map((c) => { c.Area = "West Englewood"; return c; });

        return;
      });

    return Promise.all([ePromise, wePromise])
      .then(() => {
        //combine the data and sort in ascending order by date
        self.data = englewoodData.concat(westEnglewoodData).sort((a,b) => { return new Date(a.Date) - new Date(b.Date); });
        console.debug("Done loading 2001-2016 crime data");
        console.debug(self);
      });
  }

  function getDataByFilter(filterFn){
    return _.filter(self.data, filterFn);
  }

  return {
    loadData,
    getDataByFilter
  };
};
