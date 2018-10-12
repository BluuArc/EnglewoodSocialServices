/* global SocialServiceModel */

// eslint-disable-next-line no-unused-vars
class SchoolDataModel {
  constructor(dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
  }

  async load (altPath = '') {
    console.debug('loading school data');
    const rawData = await window.dataDownloadController.getCsv(altPath || this._dataPath);
    // remove empty entries
    this._data = rawData.filter(m => m['Organization Name']);
    console.debug('finished', this._data);
  }

  getData (filterFn) {
    return typeof filterFn === 'function' ? this._data.filter(filterFn) : this._data.slice();
  }

  markSchoolsThatAreServices (serviceModel = new SocialServiceModel()) {
    this._data.forEach(school => {
      const servicesAtSchool = serviceModel.getServicesByLocation(school.Latitude, school.Longitude) || [];
      const serviceCategories = servicesAtSchool.map(service => serviceModel.getCategoriesFromService(service))
        .reduce((acc, val) => acc.concat(val), []);
      // only mark schools that share a location with a known service that has been properly categorized (i.e. at least 1 service category)
      if (serviceCategories.length > 0) {
        // console.debug({ school, serviceCategories });
        school.hasServices = true;
        school.serviceCategories = serviceCategories;
      }
    });
  }
}
