/* global */

// eslint-disable-next-line no-unused-vars
class LotDataModel {
  constructor (dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
  }

  async load (altPath = '') {
    console.debug('loading lot data');
    this._data = await window.dataDownloadController.getJson(altPath || this._dataPath);

    const includedAreas = ['ENGLEWOOD', 'WEST ENGLEWOOD'];
    this._data.data = this._data.data.filter(lot => includedAreas.includes(lot.community_area_name));
    this._data.clientNotes = 'Manually filtered out lots not in Englewood or West Englewood on the client side';
    console.debug('finished', this._data);
  }

  getData (filterFn) {
    const lotData = this._data.data;
    return typeof filterFn === 'function' ? lotData.filter(filterFn) : lotData.slice();
  }

  get _nameMapping () {
    return {
      Residential: 'Residential',
      BCM: 'Business, Commercial, and Manufacturing',
      POS: 'Parks and Open Space',
      PD: 'Planned Manufacturing and Development',
    };
  }

  getNameOfLotType (key) {
    return this._nameMapping[key];
  }

  get lotTypes () {
    return Object.keys(this._nameMapping);
  }

  getZoneClassification(lot = {}, isFullName = false) {
    const zone = lot.zoning_classification;
    if (zone.indexOf('R') === 0) {
      return this._nameMapping.Residential;
    } else if (zone.indexOf('PD') === 0 || zone.indexOf('PMD') === 0) {
      return isFullName ? this._nameMapping.PD : 'PD';
    } else if (zone.indexOf('POS') === 0) {
      return isFullName ? this._nameMapping.POS : 'POS';
    } else if (zone.indexOf('B') === 0 || zone.indexOf('C') === 0 || zone.indexOf('M') === 0) {
      return isFullName ? this._nameMapping.BCM : 'BCM';
    } else {
      return 'Other';
    }
  }
}
