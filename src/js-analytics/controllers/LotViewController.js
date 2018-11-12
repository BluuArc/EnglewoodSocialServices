/* global L MapView LotDataModel MapIconModel MainMarkerDropdownView MainMarkerDropdownController */

// eslint-disable-next-line no-unused-vars
class LotViewController {
  constructor ({
    mapView = new MapView(),
    lotModel = new LotDataModel(),
    mapIconModel = new MapIconModel(),
  }) {
    this._mapView = mapView;
    this._lotModel = lotModel;
    this._mainMarkerController = null;
    this._mapIconModel = mapIconModel;
    this._markerControllers = {};

    this._mapView.addClusterGroup(LotViewController.layerGroupName, {
      showCoverageOnHover: false,
      chunkedLoading: true,
      maxClusterRadius: 160,
      disableClusteringAtZoom: 18
    });

    this._lotModel.lotTypes.forEach(type => {
      this._markerControllers[type] = null;
      this._mapView.addClusterSubGroup(LotViewController.layerGroupName, type);
    });
  }

  static get layerGroupName () {
    return 'lotMarkers';
  }

  getLayerGroupNameByType (zoneType) {
    return this._lotModel.lotTypes.includes(zoneType)
      ? `${LotViewController.layerGroupName}--${zoneType}`
      : undefined;
  }

  init (mainMarkerView = new MainMarkerDropdownView(), lotControllersByType = {}) {
    this._mainMarkerController = new MainMarkerDropdownController(mainMarkerView, (state) => {
      const states = MainMarkerDropdownController.states;
      this._mapView.setClusterGroupVisibility(LotViewController.layerGroupName, state !== states.NONE);
      if (state === states.ALL) {
        this.updateAllViews(true);
      } else if (state === states.NONE) {
        this.updateAllViews(false);
      }
    });
    this._lotModel.lotTypes.forEach(type => {
      this._markerControllers[type] = lotControllersByType[type];
      this._markerControllers[type].addPreUpdateEventHandler(this.getLayerGroupNameByType(type), (isShowing) => {
        this.updateViewsByType(isShowing, type);
      });
    });

    this._initMapMarkers();
  }

  _generateLotPopupHtml (lot) {
    const ignoredFields = ['address', 'location', 'pin', 'sq_ft', 'x_coordinate', 'y_coordinate', 'zoning_classification'];
    return [
      `<strong>${lot.address} (${lot.pin})</strong>`,
      `<b>Size: </b> ${lot.sq_ft} sq. ft.`,
      `<b>Zone Classification:</b> ${this._lotModel.getZoneClassification(lot, true)} (${lot.zoning_classification})`,
      ...Object.keys(lot)
        .filter(key => !ignoredFields.includes(key))
        .map(key => `<b>${key}: </b> ${typeof lot[key] === 'object' ? JSON.stringify(lot[key]) : lot[key]}`)
    ].join('<br>');
  }

  _markerGenerator (lot, map) {
    const zoneType = this._lotModel.getZoneClassification(lot);

    const marker = L.marker(
      L.latLng(+lot.latitude, +lot.longitude),
      {
        icon: this._mapIconModel.getIconById(zoneType !== 'Other' ? zoneType : 'lotMarker'),
        riseOnHover: true,
        data: lot
      }
    ).bindPopup(
      this._generateLotPopupHtml(lot),
      { autoPan: false }
    ).on('click', () => {
      console.debug(lot);
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
    const data = this._lotModel.getData();

    this._mapView.updateClusterGroup(LotViewController.layerGroupName, (group, map, getClusterSubGroup) => {
      data.forEach(lot => {
        const zoneType = this._lotModel.getZoneClassification(lot);
        const marker = this._markerGenerator(lot, map);
        const typeGroup = getClusterSubGroup(zoneType);
        typeGroup.addLayer(marker);
      });
    });
  }

  get _hasAnyMarkersShowing () {
    return Object.values(this._markerControllers).some(c => c.viewState);
  }

  updateAllViews (showMarkers) {
    this._mapView.setClusterGroupVisibility(LotViewController.layerGroupName, showMarkers);

    Object.keys(this._markerControllers).forEach(type => {
      this._markerControllers[type].toggle(showMarkers);
    });

    const newState = showMarkers ? MainMarkerDropdownController.states.ALL : MainMarkerDropdownController.states.NONE;
    if (this._mainMarkerController.state !== newState) {
      this._mainMarkerController.state = newState;
    }
  }

  updateViewsByType (showMarkers, type) {
    this._mapView.setClusterSubGroupVisibility(LotViewController.layerGroupName, type, showMarkers);

    // update main marker view state depending on how many types are shown
    const isShowingAll = this._lotModel.lotTypes.every(type => this._markerControllers[type].viewState);
    let newState;
    if (isShowingAll) {
      newState = MainMarkerDropdownController.states.ALL;
    } else if (this._hasAnyMarkersShowing) {
      newState = MainMarkerDropdownController.states.SOME;
    } else {
      newState = MainMarkerDropdownController.states.NONE;
    }
    if (this._mainMarkerController.state !== newState) {
      this._mainMarkerController.state = newState;
    }
  }
}
