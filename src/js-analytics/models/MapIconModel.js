/* global L */

// eslint-disable-next-line no-unused-vars
class MapIconModel {
  constructor () {
    const mappings = this._generateIcons();
    this._iconMapping = mappings.regularMapping;
    this._smallIconMapping = mappings.smallMapping;
  }

  _generateIcons () {
    const regularMapping = {};
    const smallMapping = {};
    const defaultOptions = {
      fillOpacity: 1,
      circleWeight: 3.5,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    };
    const smallIconSize = [14, 23];
    const smallCircleRatio = 0.60;
    const iconColors = {
      serviceMarker: '#2e84cb',
      serviceMarkerSelected: '#cc852a',
      lotMarker: '#9c2bcb',
      schoolMarker: '#b15928',
      locationMarker: '#cb2d40'
    };
    const lotColors = {
      Residential: '#999999',
      BCM: '#ff7f00',
      POS: '#4daf4a',
      PD: '#e78ac3'
    };

    Object.keys(iconColors).forEach(iconType => {
      const options = {
        ...defaultOptions,
        color: iconColors[iconType]
      };
      regularMapping[iconType] = new L.DivIcon.SVGIcon(options);
      smallMapping[iconType] = new L.DivIcon.SVGIcon({
        ...options,
        iconSize: smallIconSize,
        circleRatio: smallCircleRatio,
      });
    });

    Object.keys(lotColors).forEach(lotType => {
      const options = {
        ...defaultOptions,
        color: iconColors.lotMarker,
        fillColor: lotColors[lotType],
        circleColor: lotColors[lotType],
        weight: 3,
      };
      regularMapping[lotType] = new L.DivIcon.SVGIcon(options);
      smallMapping[lotType] = new L.DivIcon.SVGIcon({
        ...options,
        iconSize: smallIconSize,
        circleRatio: smallCircleRatio,
        weight: 1.5,
      });
    });

    const schoolOptions = {
      ...defaultOptions,
      fillColor: iconColors.schoolMarker,
      circleColor: iconColors.schoolMarker,
      color: iconColors.serviceMarker,
      weight: 3,
    };
    regularMapping.schoolServiceMarker = new L.DivIcon.SVGIcon(schoolOptions);
    smallMapping.schoolServiceMarker = new L.DivIcon.SVGIcon({
      ...schoolOptions,
      iconSize: smallIconSize,
      circleRatio: smallCircleRatio,
    });
    return { regularMapping, smallMapping };
  }

  getIconById (id) {
    return this._iconMapping[id];
  }

  getSmallIconById (id) {
    return this._smallIconMapping[id];
  }

  autoInsertIntoDom () {
    const toInsert = Array.from(document.querySelectorAll('.map-icon-insert'));
    console.debug('to insert', toInsert);
    toInsert.forEach(elem => {
      const markerType = elem.dataset && elem.dataset.marker;
      const marker = this.getSmallIconById(markerType);
      if (marker) {
        elem.innerHTML = marker.options.html;
        elem.classList.remove('map-icon-insert');
        elem.classList.add('map-icon-inserted');
      }
    });
  }
}
