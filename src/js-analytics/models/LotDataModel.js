/* global d3 */

// eslint-disable-next-line no-unused-vars
class LotDataModel {
  constructor(dataPathEnglewood = '', dataPathWest = '') {
    this._dataPathEnglewood = dataPathEnglewood;
    this._dataPathWestEnglewood = dataPathWest;
    this._data = null;
  }

  loadCsv (path) {
    return new Promise((resolve, reject) => {
      d3.csv(path, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async load (altPathEnglewood = '', altPathWest = '') {
    console.debug('loading lot data');
    const extractCoords = (locationText) => locationText.slice(locationText.lastIndexOf('(') + 1)
      .replace(')', '')
      .split(',');
    const englewoodData = await this.loadCsv(altPathEnglewood || this._dataPathEnglewood)
      .then(data => data.map(lot => {
        lot.Area = 'Englewood';
        const coords = extractCoords(lot.Location);
        lot.Latitude = coords[0];
        lot.Longitude = coords[1];
        return lot;
      }));
    const westEnglewoodData = await this.loadCsv(altPathWest || this._dataPathWestEnglewood)
      .then(data => data.map(lot => {
        lot.Area = 'West Englewood';
        const coords = extractCoords(lot.Location);
        lot.Latitude = coords[0];
        lot.Longitude = coords[1];
        return lot;
      }));
    
    this._data = englewoodData.concat(westEnglewoodData);
    console.debug('finished', this._data);
  }

  getData (filterFn) {
    return typeof filterFn === 'function' ? this._data.filter(filterFn) : this._data.slice();
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
    const zone = lot['Zoning Classification'];
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
