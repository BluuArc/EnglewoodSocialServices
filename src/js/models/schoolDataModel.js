/* global */
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
    return App.controllers.dataDownload.getCsv(dataPath)
      .then(function (data) {
        // remove empty entries
        self.data = data.filter(m => m['Organization Name']);
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
