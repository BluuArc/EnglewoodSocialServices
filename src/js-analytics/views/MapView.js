/* global L d3 */

// eslint-disable-next-line no-unused-vars
class MapView {
  // eslint-disable-next-line no-undef
  constructor (mapId = 'service-map', mapIconModel = new MapIconModel()) {
    this._leafletMap = L.map(mapId);
    this._englewoodOutline = null;
    this._iconModel = mapIconModel;
    this._layerGroups = {};
    this._featureGroups = {};
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
    const jsonData = await new Promise((resolve, reject) => {
      d3.json(geoJsonPath, (err, d) => {
        if (err) {
          reject(err);
        } else {
          resolve(d);
        }
      });
    });

    this._englewoodOutline = L.geoJSON(jsonData, {
      style (feature) {
        const neighborhood = feature.properties.community.toLowerCase().replace(/ /g, '-');
        return {
          weight: 3,
          opacity: 0.75,
          fillOpacity: 0.2,
          className: `${neighborhood} fill stroke`,
        };
      },
    }).addTo(this._leafletMap);
  }

  addLayerGroup (name, value = []) {
    this._layerGroups[name] = L.layerGroup(value).addTo(this._leafletMap);
  }

  setLayerGroupVisibility (name, doShow) {
    const layerGroup = this._layerGroups[name];
    if (doShow) {
      layerGroup.addTo(this._leafletMap);
    } else {
      layerGroup.remove();
    }
  }

  updateLayerGroup (name, { featureGenerator, data }) {
    const layerGroup = this._layerGroups[name];
    layerGroup.clearLayers();
    data.forEach(entry => {
      const feature = featureGenerator(entry, layerGroup, this._leafletMap);
      feature.addTo(layerGroup);
    });
  }
}
