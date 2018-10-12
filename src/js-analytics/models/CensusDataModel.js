/* global turf rbush */

// eslint-disable-next-line no-unused-vars
class CensusDataModel {
  constructor (dataPathGrid = '', dataPathNames = '') {
    this._dataPathGrid = dataPathGrid;
    this._dataPathNames = dataPathNames;

    this._tree = rbush();
    this._gridData = null;
    this._geoIdMapping = {};
    this._mapTypeNames = null;
  }

  async load (altPathGrid = '', altPathNames = '') {
    console.debug('loading census data');
    await this._loadNameData(altPathNames);
    await this._loadGridData(altPathGrid);
  }

  async _loadGridData (altPath) {
    this._gridData = await window.dataDownloadController.getJson(altPath || this._dataPathGrid);
    console.debug('loaded grid data', this._gridData);

    this._gridData.features.forEach((feature, index) => {
      // Array<number>: bbox extent in [ minX, minY, maxX, maxY ] order
      const bbox = turf.bbox(feature);
      this._tree.insert({
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3],
        id: index,
      });

      // get geo ID mapping
      const geoId = feature.properties.geoid10.toString();
      this._geoIdMapping[geoId] = feature;
    });
  }

  async _loadNameData (altPath) {
    this._mapTypeNames = await window.dataDownloadController.getJson(altPath || this._dataPathNames);
    console.debug('loaded name data', this._mapTypeNames);
  }

  getSubsetGeoJson ({ mainType, subType }, dataType = '') {
    const subset = {
      type: 'FeatureCollection',
      features: this._gridData.features
        // ignore features with no data
        .filter(feature => feature.properties.census[mainType] && feature.properties.census[mainType][subType])
        .map(feature => ({
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            value: feature.properties.census[mainType][subType],
            data: (dataType === 'full' && feature.properties.census) ||
              (dataType === 'main' && feature.properties.census[mainType]) ||
              undefined,
            blockName: feature.properties.name10,
            geoId: feature.properties.geoid10,
            description: { mainType, subType },
          },
        })),
    };

    console.debug('subset', subset);
    return subset;
  }

  getDataWithinPolygon (boundsPolygon) {
    const boundData = {};
    const bbox = turf.bbox(boundsPolygon);

    const intersectingFeatures = this._tree.search({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
    });

    Object.keys(this._mapTypeNames).forEach(property => {
      boundData[property] = {};
      
      this._mapTypeNames[property].forEach(subProperty => {
        boundData[property][subProperty] = 0;
      });
    });

    intersectingFeatures.forEach(item => {
      const feature = this._gridData.features[item];
      const intersectPoly = turf.intersect(boundsPolygon, feature);
      if (intersectPoly) {
        const areaRatio = turf.area(intersectPoly) / turf.area(feature);

        Object.keys(this._mapTypeNames).forEach(property => {
          this._mapTypeNames[property].forEach(subProperty => {
            boundData[property][subProperty] += feature.properties.census[property][subProperty] * areaRatio;
          });
        });
      }
    });

    return {
      area: turf.area(boundsPolygon),
      dataTotals: boundData,
    };
  }

  getDataWithinBounds (bounds) {
    const boundsPolygon = turf.polygon([
      [
        [bounds[0].lng, bounds[0].lat],
        [bounds[0].lng, bounds[1].lat],
        [bounds[1].lng, bounds[1].lat],
        [bounds[1].lng, bounds[0].lat],
        [bounds[0].lng, bounds[0].lat]
      ]
    ]);
    return this.getDataWithinPolygon(boundsPolygon);
  }

  get blockLevelData () {
    return this._gridData.features;
  }

  getDataByGeoId (geoId = '') {
    return this._geoIdMapping[geoId.toString()];
  }

  getSubCategoriesOf (mainType, ignoreTotal = false) {

    const subCategories = this._mapTypeNames[mainType].slice();

    if (ignoreTotal && (subCategories[0] || '').toLowerCase() === 'total') {
      return subCategories.slice(1);
    } else {
      return subCategories;
    }
  }

  get mainCategories () {
    return Object.keys(this._mapTypeNames);
  }
}
