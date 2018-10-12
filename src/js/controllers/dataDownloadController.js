/* global d3 */

'use strict';

// controller for getting data files specific to tool
// eslint-disable-next-line no-unused-vars
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

  function getText (path = '') {
    return new Promise(function (fulfill, reject) {
      d3.text(generateFullUrl(path), function (err, data) {
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
    getText,
    setRootUrl,
  };
};
