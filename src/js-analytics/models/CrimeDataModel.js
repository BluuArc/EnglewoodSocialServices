// eslint-disable-next-line no-unused-vars
class CrimeDataModel {
  constructor(dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
  }

  async load (altPath = '') {
    console.debug('loading crime data');
    this._data = await window.dataDownloadController.getJson(altPath || this._dataPath);
    console.debug('finished', this._data);
  }

  getData (filterFn) {
    const crimeData = this._data.data;
    return typeof filterFn === 'function' ? crimeData.filter(filterFn) : crimeData.slice();
  }
}
