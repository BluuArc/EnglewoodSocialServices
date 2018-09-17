/* global L MarkerViewController MapView SchoolDataModel MapIconModel SocialServiceModel */

// eslint-disable-next-line no-unused-vars
class SchoolViewController {
  constructor ({
    mapView = new MapView(),
    schoolModel = new SchoolDataModel(),
    mapIconModel = new MapIconModel(),
    serviceModel = new SocialServiceModel(),
  }) {
    this._mapView = mapView;
    this._schoolModel = schoolModel;
    this._markerViewController = null;
    this._mapIconModel = mapIconModel;
    this._serviceModel = serviceModel;

    this._mapView.addLayerGroup(SchoolViewController.layerGroupName);
  }

  static get layerGroupName () {
    return 'schoolMarkers';
  }

  init (schoolMarkerViewController = new MarkerViewController()) {
    this._markerViewController = schoolMarkerViewController;
    this._markerViewController.addPreUpdateEventHandler(SchoolViewController.layerGroupName, (isShowing) => {
      this.updateViews(isShowing);
    });
  }

  get filteredData () {
    return this._schoolModel.getData();
  }

  _generateSchoolPopupHtml (schoolEntry) {
    let serviceDataEntry = [];
    if (schoolEntry.hasServices) {
      const serviceData = schoolEntry.serviceCategories;
      const dataByMainType = {};
      serviceData.forEach(({ mainType, subType }) => {
        if (!dataByMainType[mainType]) {
          dataByMainType[mainType] = [];
        }
        if (!dataByMainType[mainType].includes(subType)) {
          dataByMainType[mainType].push(subType);
        }
      });

      serviceDataEntry = Object.keys(dataByMainType)
        .map(mainType => `<li>${mainType} - ${dataByMainType[mainType].join(', ')}</li>`);
    }

    return `
      <b>${schoolEntry['Organization Name']}</b><br>
      ${schoolEntry.Address}<br>
      ${schoolEntry.City}, ${schoolEntry.State}, ${schoolEntry.Zip}<br>
      ${serviceDataEntry.length > 0 ? `<b>Services Offered</b><br><ul style="padding-left: 16px;">${serviceDataEntry.join('')}</ul>` : ''}
    `;
  }

  _markerGenerator (schoolEntry, map) {
    const marker = L.marker(
      L.latLng(+schoolEntry.Latitude || 0, +schoolEntry.Longitude || 0),
      {
        icon: this._mapIconModel.getIconById(schoolEntry.hasServices ? 'schoolServiceMarker' : 'schoolMarker'),
        riseOnHover: true,
        data: schoolEntry,
      }
    ).bindPopup(
      this._generateSchoolPopupHtml(schoolEntry),
      { autoPan: false }
    ).on('click', () => {
      console.debug(schoolEntry);
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

  updateViews (showMarkers) {
    const markerGenerator = (serviceEntry, layerGroup, map) => this._markerGenerator(serviceEntry, map);
    this._mapView.updateLayerGroup(
      SchoolViewController.layerGroupName, {
        featureGenerator: markerGenerator,
        data: this.filteredData,
      },
    );

    if (this._markerViewController.viewState !== showMarkers) {
      this._markerViewController.viewState = showMarkers;
    }
  }
}
