/* global L d3 */

// eslint-disable-next-line no-unused-vars
class MapView {
  // eslint-disable-next-line no-undef
  constructor (mapId = 'service-map', mapIconModel = new MapIconModel()) {
    this._leafletMap = L.map(mapId);
    this._englewoodOutline = null;
    this._iconModel = mapIconModel;
    this._layerGroups = {};
    this._clusterGroups = {};
    this._clusterSubGroups = {};
  }

  async initMap (geoJsonPath) {
    // use mapbox map
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 19,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiYW5kcmV3dGJ1cmtzIiwiYSI6ImNpdnNmcHQ0ejA0azYydHBrc3drYWRwcTgifQ.pCA_a_l6sPcMo8oGzg5stQ'
    }).addTo(this._leafletMap);

    // lat/lng in Englewood
    this._leafletMap.setView([41.7750541, -87.6585445], 14);

    this._leafletMap.zoomControl.setPosition('bottomright');

    await this._drawEnglewoodOutline(geoJsonPath);
  }

  async _drawEnglewoodOutline(geoJsonPath = './data/EnglewoodCommunityAreaBoundaries.geojson') {
    const jsonData = await window.dataDownloadController.getJson(geoJsonPath);

    this._englewoodOutline = L.geoJSON(jsonData, {
      style (feature) {
        const neighborhood = feature.properties.community.toLowerCase().replace(/ /g, '-');
        return {
          weight: 3,
          opacity: 0.75,
          fillOpacity: 0.2,
          className: `${neighborhood} fill stroke geoJson-englewoodOutline`,
          pointerEvents: 'none',
        };
      },
    }).addTo(this._leafletMap);
  }

  get englewoodOutline () {
    return this._englewoodOutline;
  }

  _setLeafletElementVisibility (elem, doShow) {
    if (doShow) {
      elem.addTo(this._leafletMap);
    } else {
      elem.remove();
    }
  }

  addLayerGroup (name, value = []) {
    this._layerGroups[name] = L.layerGroup(value).addTo(this._leafletMap);
  }

  setLayerGroupVisibility (name, doShow) {
    const layerGroup = this._layerGroups[name];
    this._setLeafletElementVisibility(layerGroup, doShow);
  }

  updateLayerGroup (name, { featureGenerator, data = [] }) {
    const layerGroup = this._layerGroups[name];
    layerGroup.clearLayers();
    data.forEach(entry => {
      const feature = featureGenerator(entry, layerGroup, this._leafletMap);
      if (feature) {
        feature.addTo(layerGroup);
      }
    });
  }

  _generateClusterSubGroupKey (name, subName) {
    return [name, subName].join('-');
  }

  addClusterGroup (name, options) {
    this._clusterGroups[name] = L.markerClusterGroup(options).addTo(this._leafletMap);
  }

  addClusterSubGroup (name, subName) {
    const parentGroup = this._clusterGroups[name];
    const subGroupKey = this._generateClusterSubGroupKey(name, subName);
    this._clusterSubGroups[subGroupKey] = L.featureGroup.subGroup(parentGroup).addTo(this._leafletMap);
  }

  setClusterGroupVisibility (name, doShow) {
    const clusterGroup = this._clusterGroups[name];
    this._setLeafletElementVisibility(clusterGroup, doShow);
  }

  setClusterSubGroupVisibility (name, subName, doShow) {
    const subGroup = this._clusterSubGroups[this._generateClusterSubGroupKey(name, subName)];
    this._setLeafletElementVisibility(subGroup, doShow);
  }

  updateClusterGroup (name, manipulatorFn) {
    manipulatorFn(this._clusterGroups[name], this._leafletMap, (subName) => {
      return this._clusterSubGroups[this._generateClusterSubGroupKey(name, subName)];
    });
  }

  updateClusterSubGroup (name, subName, manipulatorFn) {
    const subGroup = this._clusterSubGroups[this._generateClusterSubGroupKey(name, subName)];
    manipulatorFn(subGroup, this._leafletMap);
  }
}
