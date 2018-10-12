/* global d3 _ */

// eslint-disable-next-line no-unused-vars
class ServiceTaxonomyModel {
  constructor(dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
    this._categoryCodeMapping = null;
  }

  async load (altPath = '') {
    console.debug('loading service taxonomy data');
    const data = await window.dataDownloadController.getJson(altPath || this._dataPath);

    const codeMapping = {};
    Object.keys(data).forEach(code => {
      const descriptionKey = data[code].description.toLowerCase();
      codeMapping[descriptionKey] = code;
    });
    this._data = data;
    this._categoryCodeMapping = codeMapping;
    console.debug('finished', this._data);
  }

  get allTier1Categories () {
    return Object.keys(this._data).map(key => this._data[key].description);
  }

  get allTier2Categories () {
    return _.flatten(Object.keys(this._data).map(k => this._data[k].children))
      .map(c => c.trim());
  }

  getTier1CategoriesOf (tier2CategoryList = []) {
    const listToTier1 = tier2CategoryList.map(t2 => _.findKey(this._data, t1 => t1.children.includes(t2)));
    const tier1Set = _.uniq(listToTier1);
    return tier1Set.map(code => this._data[code].description);
  }

  getTier2CategoriesOf (tier1Category = '') {
    return this._data[this.getCategoryCodeOf(tier1Category)].children.map(c => c.trim());
  }

  getCategoryCodeOf (tier1Category) {
    return this._categoryCodeMapping[tier1Category.toLowerCase()];
  }

  getMainCategoryOf (categoryCode) {
    return this._data[categoryCode] && this._data[categoryCode].description;
  }
}
