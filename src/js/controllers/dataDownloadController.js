'use strict';

// controller for getting data files specific to tool
const DataDownloadController = function (rootUrl) {
  const self = {
    rootUrl: '',
  };

  function init () {
    self.rootUrl = rootUrl !== undefined ? rootUrl : '';
  }
  init();

  function setRootUrl (newRoot) {
    self.rootUrl = newRoot;
  }

  function generateFullUrl (path) {
    return [self.rootUrl, path].join('');
  }

  function getCsv (path) {
    return new Promise(function (fulfill, reject) {
      d3.csv(generateFullUrl(path), function(err, data) {
        if (err) {
          reject(err);
        } else {
          fulfill(data);
        }
      });
    });
  }

  function getJson (path = '') {
    return new Promise(function (fulfill, reject) {
      d3.json(generateFullUrl(path), function (err, data) {
        if (err) {
          reject(err);
        } else {
          fulfill(data);
        }
      });
    });
  }

  return {
    getCsv,
    getJson,
    setRootUrl,
  };
};
