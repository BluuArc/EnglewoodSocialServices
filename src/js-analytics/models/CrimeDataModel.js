// eslint-disable-next-line no-unused-vars
class CrimeDataModel {
  constructor(dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
    this._availableTypes = [];
  }

  async load (altPath = '') {
    console.debug('loading crime data');
    this._data = await window.dataDownloadController.getJson(altPath || this._dataPath);
    
    // collect available types
    this._data.data.forEach(crime => {
      const cleanedType = this.getCrimeType(crime);
      if (!this._availableTypes.includes(cleanedType)) {
        this._availableTypes.push(cleanedType);
      }
    });
    this._availableTypes = this._availableTypes.slice().sort();
    console.debug('finished', this._data, this._availableTypes);
  }

  getCrimeType (crime) {
    return crime.primary_type.replace(/ /g, '_');
  }

  getData (filterFn) {
    const crimeData = this._data.data;
    return typeof filterFn === 'function' ? crimeData.filter(filterFn) : crimeData.slice();
  }

  get types () {
    return this._availableTypes.slice();
  }
}
