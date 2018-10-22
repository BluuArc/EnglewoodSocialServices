'use strict';

module.exports = class DataCache {
  // default to 5 minute expire time
  constructor (getter = () => {}, expireTimeInMs = 300 * 1000) {
    this._getter = (params) => Promise.resolve(getter(params));
    this._expireTime = expireTimeInMs;
    this._data = null;
    this._getTime = new Date('Oct 22 2018');
    this._defaultGetTime = new Date('Oct 22 2018');
  }

  get cacheIsInvalid () {
    return (new Date() - this._getTime) > this._expireTime;
  }

  async getValue (params, forceRefresh = false) {
    if (this.cacheIsInvalid || forceRefresh) {
      this._data = await this._getter(params);
      this._getTime = new Date();
    }
    return this._data;
  }

  get updateTime () {
    return this._getTime;
  }
};
