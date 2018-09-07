/* global d3 */

// eslint-disable-next-line no-unused-vars
class SocialServiceModel {
  constructor(dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
  }

  async load (altPath = '') {
    console.debug('loading social service data');
    const rawData = await new Promise((resolve, reject) => {
      d3.csv(altPath || this._dataPath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // filter out empty entries
    this._data = rawData.filter(d => {
      const values = Object.values(d);
      const result = values.some(val => typeof val === 'string' && val.length > 0);
      if (!result) {
        console.debug('ignoring entry', d);
      }
      return result;
    });

    console.debug('finished', this._data);
  }
}
