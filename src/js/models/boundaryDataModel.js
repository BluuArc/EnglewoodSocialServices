/* global d3 turf */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let BoundaryDataModel = function () {
  let self = {
    westEnglewoodPoly: null,
    englewoodPoly: null,
    // geoData: null,
  };

  function loadData() {
    return new Promise(function (fulfill, reject) {
      const validProperties = ['WEST ENGLEWOOD','ENGLEWOOD'];
      d3.json('./data/EnglewoodCommunityAreaBoundaries.geojson', function (error, json) {
        if(error) reject(error);

        // self.geoData = json;
        for(let feature of json.features){
          let index = validProperties.indexOf(feature.properties.community);
          if(index === 0){
            self.westEnglewoodPoly = turf.polygon(feature.geometry.coordinates[0]);
          }else if(index === 1){
            self.englewoodPoly = turf.polygon(feature.geometry.coordinates[0]);
          }
        }
        fulfill();
      }
      );
    });
  }

  function convertLeafletPointToTurfPoint(point){
    return [point.lng,point.lat];
  }

  function isInWestEnglewood(point){
    if(point.lng || point.lat){
      point = convertLeafletPointToTurfPoint(point);
    }
    return turf.inside(point,self.westEnglewoodPoly);
  }

  function isInEnglewood(point){
    if (point.lng || point.lat) {
      point = convertLeafletPointToTurfPoint(point);
    }
    return turf.inside(point,self.englewoodPoly);
  }

  function isInEitherEnglewood(point){
    return isInEnglewood(point) || isInWestEnglewood(point);
  }

  function getWestEnglewoodPolygon(){
    return self.westEnglewoodPoly;
  }

  function getEnglewoodPolygon(){
    return self.englewoodPoly;
  }

  return {
    loadData,
    isInWestEnglewood,
    isInEnglewood,
    isInEitherEnglewood,
    getWestEnglewoodPolygon,
    getEnglewoodPolygon
  };
};
