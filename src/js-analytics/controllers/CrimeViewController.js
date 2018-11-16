/* global L MarkerViewController MainMarkerDropdownController MainMarkerDropdownView MapView CrimeDataModel MapIconModel */

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
    this._markerControllers = {};

    this._mapView.addClusterGroup(CrimeViewController.layerGroupName, {
      showCoverageOnHover: false,
      disableClusteringAtZoom: 18,
      chunkedLoading: true,
      maxClusterRadius: 160,
      iconCreateFunction: this._mapIconModel.getIconGeneratorById('crimeClusterIcon'),
    });

    this._crimeModel.types.forEach(type => {
      this._markerControllers[type] = null;
      this._mapView.addClusterSubGroup(CrimeViewController.layerGroupName, type);
    });
  }

  static get layerGroupName () {
    return 'crimeMarkers';
  }

  getLayerGroupNameByType (crimeType) {
    return this._crimeModel.types.includes(crimeType)
      ? `${CrimeViewController.layerGroupName}--${crimeType}`
      : undefined;
  }

  init (mainMarkerDropdownView = new MainMarkerDropdownView()) {
    this._mainMarkerController = new MainMarkerDropdownController(mainMarkerDropdownView, (state) => {
      const states = MainMarkerDropdownController.states;
      this._mapView.setClusterGroupVisibility(CrimeViewController.layerGroupName, state !== states.NONE);
      if (state === states.ALL) {
        this.updateAllViews(true);
      } else if (state === states.NONE) {
        this.updateAllViews(false);
      }
    });

    // initialize dropdown elements
    const dropdown = mainMarkerDropdownView.dropdown;
    this._crimeModel.types.forEach(type => {
      const dropdownEntry = document.createElement('li');
      dropdownEntry.innerHTML = `
        <a href="" id="toggle-crime-marker--${type.toLowerCase()}">
          <i class="glyphicon glyphicon-unchecked"></i>
          <span>${type.replace(/_/g, ' ')}</span>
        </a>
      `;
      dropdown.appendChild(dropdownEntry);

      this._markerControllers[type] = new MarkerViewController(
        `#main-marker-dropdown #toggle-crime-marker--${type.toLowerCase()}`,
        () => this._mapView.setClusterSubGroupVisibility(CrimeViewController.layerGroupName, type, false),
        () => this._mapView.setClusterSubGroupVisibility(CrimeViewController.layerGroupName, type, true),
        false,
        true,
      );

      this._markerControllers[type].addPreUpdateEventHandler(this.getLayerGroupNameByType(type), (isShowing) => {
        this.updateViewsByType(isShowing, type);
      });

    });
    this._initMapMarkers();
  }

  _generatePopupHtml (crime) {
    return Object.keys(crime)
      .map(key => `<b>${key}: </b> ${typeof crime[key] === 'object' ? JSON.stringify(crime[key]) : crime[key]}`)
      .join('<br>');
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

    this._mapView.updateClusterGroup(CrimeViewController.layerGroupName, (group, map, getClusterSubGroup) => {
      data.forEach(crime => {
        const crimeType = this._crimeModel.getCrimeType(crime);
        const marker = this._markerGenerator(crime, map);
        const typeGroup = getClusterSubGroup(crimeType);
        typeGroup.addLayer(marker);
      });
    });
  }

  get _hasAnyMarkersShowing () {
    return Object.values(this._markerControllers).some(c => c.viewState);
  }

  updateAllViews (showMarkers) {
    this._mapView.setClusterGroupVisibility(CrimeViewController.layerGroupName, showMarkers);

    Object.keys(this._markerControllers).forEach(type => {
      this._markerControllers[type].toggle(showMarkers);
    });

    const newState = showMarkers ? MainMarkerDropdownController.states.ALL : MainMarkerDropdownController.states.NONE;
    if (this._mainMarkerController.state !== newState) {
      this._mainMarkerController.state = newState;
    }
  }

  updateViewsByType (showMarkers, type) {
    this._mapView.setClusterSubGroupVisibility(CrimeViewController.layerGroupName, type, showMarkers);

    // update main marker view state depending on how many types are shown
    const isShowingAll = this._crimeModel.types.every(type => this._markerControllers[type].viewState);
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
