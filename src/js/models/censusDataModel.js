/* global turf rbush _ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let CensusDataModel = function() {
  let self = {
    tree: null,

    gridData: null,
    mapTypeNames: null,
    dataByGeoId: {}
  };

  self.tree = rbush();

  function loadData() {
    const allDataBlocksP = App.controllers.dataDownload.getJson('./data/censusDataBlocks.geojson')
      .then(function (json) {
        self.gridData = json;

        // create tree containing all blocks
        for (const featureInd in self.gridData.features) {
          // Array<number>: bbox extent in [ minX, minY, maxX, maxY ] order
          const bbox = turf.bbox(self.gridData.features[featureInd]);

          const item = {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3],
            id: featureInd
          };

          self.tree.insert(item);
        }

        console.debug('Loaded grid data', json);

        self.gridData.features.forEach(feature => {
          const geoId = feature.properties.geoid10.toString();
          self.dataByGeoId[geoId] = feature;
        });
        console.debug('geoid-keyed data', self.dataByGeoId);

        return json;
      });

    const mapTypeNamesP = App.controllers.dataDownload.getJson('./data/censusDataNames.json')
      .then(function (json) {
        self.mapTypeNames = json;

        console.debug('Loaded map type names', json);
        return json;
      });

    return Promise.all([allDataBlocksP, mapTypeNamesP]);
  }

  function getSubsetGeoJSON(propertyTypes, type = '') {
    // return (self.gridData);

    let subset = {
      type: 'FeatureCollection',
      features: _.map(self.gridData.features, feature => {
        return {
          type: 'Feature',
          geometry: feature.geometry,
          properties: {
            data: feature.properties.census[propertyTypes.mainType][propertyTypes.subType],
            fullData: (type === 'full') ? feature.properties.census : ((type === 'main') ? feature.properties.census[propertyTypes.mainType] : undefined),
            blockName: feature.properties.name10,
            geoId: feature.properties.geoid10,
            description: propertyTypes
          }
        };
      })
    };

    // ignore any features with no data
    subset.features = _.filter(subset.features, o => o.properties.data);

    console.debug(subset);

    return subset;
  }

  function getDataWithinPolygon(boundsPolygon){
    console.time('getDataWithinPolygon');
    
    let boundData = {};
    let bbox = turf.bbox(boundsPolygon);

    let intersectingFeatures = self.tree.search({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3]
    });

    for (let property of Object.keys(self.mapTypeNames)) {
      boundData[property] = {};

      for (let subproperty of self.mapTypeNames[property]) {
        boundData[property][subproperty] = 0;
      }
    }

    for (let item of intersectingFeatures) {
      let feature = self.gridData.features[item.id];
      let intersectPoly = turf.intersect(boundsPolygon, feature);

      if (intersectPoly) {
        let areaRatio = turf.area(intersectPoly) / turf.area(feature);

        for (let property of Object.keys(self.mapTypeNames)) {
          for (let subproperty of self.mapTypeNames[property]) {
            boundData[property][subproperty] += (feature.properties.census[property][subproperty] * areaRatio);
          }
        }
      }
    }

    console.timeEnd('getDataWithinPolygon');

    return {
      area: turf.area(boundsPolygon),
      dataTotals: boundData
    };
  }

  function getDataWithinBounds(bounds) {

    let boundsPolygon = turf.polygon([[
      [bounds[0].lng, bounds[0].lat],
      [bounds[0].lng, bounds[1].lat],
      [bounds[1].lng, bounds[1].lat],
      [bounds[1].lng, bounds[0].lat],
      [bounds[0].lng, bounds[0].lat]
    ]]);

    return getDataWithinPolygon(boundsPolygon);
  }

  function getBlockLevelData() {
    return self.gridData.features;
  }

  function getDataByGeoId(geoId) {
    return self.dataByGeoId[geoId.toString()];
  }

  function getSubCategories(mainType) {
    return self.mapTypeNames[mainType];
  }

  return {
    loadData,
    getSubsetGeoJSON,
    getDataWithinBounds,
    getDataWithinPolygon,
    getSubCategories,
    getBlockLevelData,
    getDataByGeoId
  };
};
