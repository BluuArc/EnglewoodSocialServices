/* global d3 */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let SchoolDataModel = function () {
  let self = {
    data: null
  };

  init();

  function init() {}

  function loadData(dataPath) {
    return new Promise((fulfill,reject) => {
      d3.csv(dataPath, (err,data) => {
        if(err){
          reject(err);
          return;
        }

        // remove empty entries
        self.data = data.filter(m => m['Organization Name']);

        fulfill();
      });
    });
  }

  function getData() {
    return self.data;
  }

  return {
    loadData,
    getData
  };
};
