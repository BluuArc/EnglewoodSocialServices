"use strict";

var App = App || {};

let LeafletMarkerViewController = function (buttonID, buttonTextID, markerName) {
    let self = {
        button: null,

        visibleMarkers: true,
        markerArray: null,
        markerD3Selection: null,
        customToggleFunc: null
    };

    init();

    function init() {
        self.button = d3.select(buttonID)
            .on("click", handleButtonClick);
    }

    //markerArray is an array of L.marker() objects from the mapView.plotServices function (or similar plot functions)
    //d3SelectionOfMarkers is from mapView.plotServices function (or similar plot functions)
    function attachMarkers(markerArray, d3SelectionOfMarkers) {
        self.markerArray = markerArray;
        self.markerD3Selection = d3SelectionOfMarkers;
    }

    function handleButtonClick() {
        setVisibilityState(!self.visibleMarkers); //toggle visibility
    }

    function setCustomToggleFunction(customToggleFunc){
        self.customToggleFunc = customToggleFunc;
    }

    //toggle markers and update button text accordingly
    function setVisibilityState(bool) {
        setMarkerVisibility(bool == true); //enforce true or false
        let buttonGlyph = self.button.select('.glyphicon');
        let buttonText = self.button.select(buttonTextID);
        buttonGlyph.classed('glyphicon-eye-close', self.visibleMarkers);
        buttonGlyph.classed('glyphicon-eye-open', !self.visibleMarkers);
        if (self.visibleMarkers) {
            buttonText.text(`Hide ${markerName} Markers`);
        } else {
            buttonText.text(`Show ${markerName} Markers`);
        }

        if(typeof self.customToggleFunc === "function"){
            self.customToggleFunc(bool,self.markerArray,self.markerD3Selection);
        }
    }

    //toggle markers directly
    function setMarkerVisibility(bool) {
        self.visibleMarkers = (bool == true); //true = visible, false = invisible
        let opacity = (bool == true) ? 1 : 0; //true = visible, false = invisible

        for (let m of self.markerArray) {
            m.setOpacity(opacity);
            m.closePopup();
        }

        if (typeof self.markerD3Selection !== "function"){
            self.markerD3Selection.classed('disabled-marker', !bool);
        }else { //used in cases where markers are constantly added and removed
            let tempSelection = self.markerD3Selection();
            tempSelection.classed('disabled-marker', !bool);
        }

    }

    function markersAreVisible() {
        return self.visibleMarkers == true;
    }


    function raise() {
        if(self.markerD3Selection){
            self.markerD3Selection.raise();
        }
    }

    return {
        markersAreVisible,
        attachMarkers,
        setVisibilityState,
        setCustomToggleFunction,
        raise
    }
}