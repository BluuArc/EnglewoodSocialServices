/* global d3 */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let MarkerToggleController = function (buttonID, buttonTextID, name) {
  let self = {
    button: null,

    visibleMarkers: true,
    markerGroup: null,
    map: null,
    customToggleFunc: null,
  };

  init();

  function init() {
    self.button = d3.select(buttonID)
      .on('click', handleButtonClick);
  }

  function attachMarkerGroup(group) {
    self.markerGroup = group;
  }

  function attachMap(map) {
    self.map = map;
  }

  function setCustomToggleFunction(customToggleFunc) {
    self.customToggleFunc = customToggleFunc;
  }

  function handleButtonClick() {
    setVisibilityState(!self.visibleMarkers, d3.event);
  }

  function setVisibilityState(bool, event) {
    self.visibleMarkers = bool == true;

    let buttonGlyph = self.button.select('.glyphicon');
    let buttonText = self.button.select(buttonTextID);
    buttonGlyph
      .classed('glyphicon-check', self.visibleMarkers)
      .classed('glyphicon-unchecked', !self.visibleMarkers);

    let toggleFunc;
    buttonText.text(`${name} Markers`);
    if (self.visibleMarkers) {
      toggleFunc = () => self.map.addLayer(self.markerGroup);
    } else {
      toggleFunc = () => self.map.removeLayer(self.markerGroup);
    }

    if(!self.customToggleFunc) {
      toggleFunc();
    }else {
      // send self parameters and next() function
      self.customToggleFunc(self, event, toggleFunc);
    }
  }

  function markersAreVisible() {
    return self.visibleMarkers == true;
  }

  function getButton() {
    return self.button;
  }

  return {
    markersAreVisible,
    attachMap,
    attachMarkerGroup,
    setVisibilityState,
    getButton,
    setCustomToggleFunction
  };
};
