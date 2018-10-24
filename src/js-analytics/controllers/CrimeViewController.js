/* global L MarkerViewController MapView CrimeDataModel MapIconModel */

// eslint-disable-next-line no-unused-vars
class CrimeViewController {
  constructor({
    mapView = new MapView(),
    crimeModel = new CrimeDataModel(),
    mapIconModel = new MapIconModel(),
  }) {
    this._mapView = mapView;
    this._crimeModel = crimeModel;
    this._mainMarkerController = null;
    this._mapIconModel = mapIconModel;

    this._mapView.addClusterGroup(CrimeViewController.layerGroupName, {
      showCoverageOnHover: false,
      disableClusteringAtZoom: 18
    });
  }

  static get layerGroupName () {
    return 'crimeMarkers';
  }

  init (mainMarkerController = new MarkerViewController()) {
    this._mainMarkerController = mainMarkerController;
    this._mainMarkerController.addPreUpdateEventHandler(CrimeViewController.layerGroupName, (isShowing) => {
      this.updateAllViews(isShowing);
    });
    this._initMapMarkers();
  }

  _generatePopupHtml (crime) {
    // return [
    // ].join('<br>');
    return JSON.stringify(crime);
  }

  _markerGenerator (crime, map) {
    const marker = L.marker(
      L.latLng(+crime.latitude, +crime.longitude), {
        icon: this._mapIconModel.getIconById('crimeMarker'),
        riseOnHover: true,
        data: crime
      }
    ).bindPopup(
      this._generatePopupHtml(crime), {
        autoPan: false
      }
    ).on('click', () => {
      console.debug(crime);
      map.closePopup();
    }).on('mouseover', function () {
      marker.openPopup();
    }).on('mouseout', function () {
      if (!this.options.data.expanded) {
        map.closePopup();
      }
    });
    return marker;
  }

  _initMapMarkers () {
    const data = this._crimeModel.getData();

    this._mapView.updateClusterGroup(CrimeViewController.layerGroupName, (group, map) => {
      data.forEach(crime => {
        const marker = this._markerGenerator(crime, map);
        marker.addTo(group);
      });
    });
  }

  updateAllViews (showMarkers) {
    this._mapView.setClusterGroupVisibility(CrimeViewController.layerGroupName, showMarkers);
  }
}
