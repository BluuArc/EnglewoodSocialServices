/* global _ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let ServiceTaxonomyModel = function() {
  let self = {
    data: null,
    categoryCodeMap: {}
  };

  init();

  function init() {

  }

  function loadData(dataPath) {
    return App.controllers.dataDownload.getJson(dataPath)
      .then(function (data) {
        self.data = data;

        for (const code of Object.keys(self.data)) {
          self.categoryCodeMap[self.data[code].description.toLowerCase()] = code;
        }

        console.debug(self.data);
        return;
      });
  }

  function getTier1Categories() {
    return Object.keys(self.data).map(k => self.data[k].description);
  }

  function getTier1CategoriesOf(tier2CategoryList) {
    return _.map(
      _.uniq(
        _.map(tier2CategoryList,
          t2 => _.findKey(self.data, t1 => _.includes(t1.children, t2))
        )
      ),
      code => self.data[code].description);
  }

  function getAllTier2Categories() {
    return _.flatten(Object.keys(self.data).map(k => self.data[k].children)).map(c => c.trim());
  }

  function getTier2CategoriesOf(tier1Category) {
    return self.data[self.categoryCodeMap[tier1Category.toLowerCase()]].children.map(c => c.trim());
  }

  function getCategoryCodeOf(tier1Category = '') {
    return self.categoryCodeMap[tier1Category.toLowerCase()];
  }

  function getData() {
    return self.data;
  }

  return {
    loadData,
    getTier1Categories,
    getTier1CategoriesOf,
    getAllTier2Categories,
    getTier2CategoriesOf,
    getCategoryCodeOf,
    getData
  };
};
