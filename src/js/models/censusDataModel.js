"use strict";

var App = App || {};

let CensusDataModel = function() {
  let self = {
    tree: null,

    gridData: null,
    mapTypeNames: null
  };

  self.tree = rbush();

  function loadData() {
    // load mapTypeNames.json as well as allDataBlocks.geojson
    const allDataBlocksP = App.controllers.dataDownload.getJson("./data/allDataBlocks.geojson")
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
        return json;
      });

    const mapTypeNamesP = App.controllers.dataDownload.getJson("./data/mapTypeNames.json")
      .then(function (json) {
        self.mapTypeNames = json;
        return json;
      });

    return Promise.all([allDataBlocksP, mapTypeNamesP]);
  }

  function getSubsetGeoJSON(propertyTypes, getMainType) {
    // return (self.gridData);

    let subset = {
      type: "FeatureCollection",
      features: _.map(self.gridData.features, feature => {
        return {
          type: "Feature",
          geometry: feature.geometry,
          properties: {
            data: feature.properties.census[propertyTypes.mainType][propertyTypes.subType],
            fullData: (getMainType) ? feature.properties.census[propertyTypes.mainType] : undefined,
            blockName: feature.properties.name10,
            description: propertyTypes
          }
        };
      })
    };

    // ignore any features with no data
    subset.features = _.filter(subset.features, o => o.properties.data);

    console.log(subset);

    return subset;
  }

  function getDataWithinPolygon(boundsPolygon){
    console.time("getDataWithinPolygon");
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

    console.timeEnd("getDataWithinPolygon");

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

  function getSubCategories(mainType) {
    return self.mapTypeNames[mainType];
  }

  return {
    loadData,
    getSubsetGeoJSON,
    getDataWithinBounds,
    getDataWithinPolygon,
    getSubCategories
  };
};
