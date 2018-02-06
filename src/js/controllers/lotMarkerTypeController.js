"use strict";

var App = App || {};

let LotMarkerTypeController = function(buttonID, buttonTextID) {
  let self = {
    button: null,

    showingLotTypes: false,
    general: null,
    lotType: null
  };

  init();

  function init(params) {
    self.button = d3.select(buttonID)
      .on("click", handleButtonClick);
  }

  function handleButtonClick(){
    setState(!self.showingLotTypes);
  }

  function attachMarkerControllers(general, lotType){
    self.general = general;
    self.lotType = lotType;
  }

  function setState(state){
    self.showingLotTypes = (state == true);

    let buttonGlyph = self.button.select('.glyphicon');
    let buttonText = self.button.select(buttonTextID);

    buttonGlyph.classed('glyphicon-eye-close', self.showingLotTypes);
    buttonGlyph.classed('glyphicon-eye-open', !self.showingLotTypes);
    buttonText.text(`${self.showingLotTypes ? "Hide" : "Show"} Lot Types`);

    if(self.showingLotTypes){
      self.general.setVisibilityState(!self.showingLotTypes);
      self.lotType.setVisibilityState(self.showingLotTypes);
      $(self.general.getButton().node().parentNode).hide();
      $(self.lotType.getButton().node().parentNode).show();
    }else{
      self.lotType.setVisibilityState(self.showingLotTypes);
      self.general.setVisibilityState(!self.showingLotTypes);
      $(self.lotType.getButton().node().parentNode).hide();
      $(self.general.getButton().node().parentNode).show();
    }
  }

  function showLotTypes() {
    setState(true);
  }

  function hideLotTypes() {
    setState(false);
  }

  function hideButton() {
    $(self.button.node()).hide();
  }

  function showButton() {
    $(self.button.node()).show();
  }

  return {
    attachMarkerControllers,
    setState,

    showLotTypes,
    hideLotTypes,
    hideButton,
    showButton
  }
}
