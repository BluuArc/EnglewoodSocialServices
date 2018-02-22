"use strict";

var App = App || {};

let LocationButtonController = function() {
  let self = {
    locationButton: null,
    addressLookupButton: null,
    locationInput: null,
    currentlyEnteredLocation: null
  };

  init();

  function init() {
  }

  function attachSearchInput(){
    self.locationButton = d3.select('#addressInput')
      .on("keyup", function() {
        if (d3.event.keyCode == 13) {
          console.debug("enter!");
          // hitting enter in the input is equivalent to pressing accept button
          var address = d3.select('#addressInput').node().value;
          getLatLngFromAddress(address);
          $('#locationModal').modal('hide');

        }
      });
  }

  function attachLocationButton(id) {
    self.locationButton = d3.select(id)
      .on('click', updateLocationOnMap);
    console.debug('adding event handler to ', id);

  }

  function attachAddressLookupButton(id) {
    
    self.addressLookupButton = d3.select(id)
      .on('click', function(){
        var address = d3.select('#addressInput').node().value;
        getLatLngFromAddress(address);
      });

    console.debug('adding event handler to ', id);
  }

  function updateLocationOnMap() {
    // make this and call App.views.map.setLocation()
    // using data from https://www.w3schools.com/html/html5_geolocation.asp
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        successCallback,
        highAccuracyErr, {
          maximumAge: 600000,
          timeout: 5000,
          enableHighAccuracy: true
        });
    }

    function successCallback(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      updateCurrentLocation(pos);
    }

    function highAccuracyErr(error) {
      console.warn("Can't get your location (high accuracy attempt)");
      navigator.geolocation.getCurrentPosition(
        successCallback,
        lowAccuracyErr, {
          maximumAge: 600000,
          timeout: 5000,
          enableHighAccuracy: false
        });
    }

    function lowAccuracyErr(error) {
      var msg = "Can't get your location (low accuracy attempt). Error = ";
      if (error.code == 1)
        msg += "PERMISSION_DENIED";
      else if (error.code == 2)
        msg += "POSITION_UNAVAILABLE";
      else if (error.code == 3)
        msg += "TIMEOUT";
      msg += ", msg = " + error.message;

      alert(msg);
    }
  }

  function getLatLngFromAddress(address, callback) {
    // Google Maps Geocoding API:
    //    https://developers.google.com/maps/documentation/geocoding/start#get-a-key
    // API Key: AIzaSyAUDFjBPoiSQprcBvEhc9w6SJeR3EK4IGI

    // console.debug(d3.select('#addressInput').node().value);

    // var address = d3.select('#addressInput').node().value;

    var replaced = address.split(' ').join('+');
    console.debug(replaced);

    var object = d3.json("https://maps.googleapis.com/maps/api/geocode/json?address=" + replaced + "&key=AIzaSyAUDFjBPoiSQprcBvEhc9w6SJeR3EK4IGI", function(err, d) {
      
      if (d.results && d.results[0]) {
      let pos = d.results[0].geometry.location;

      updateCurrentLocation(pos);
      callback(pos);
      } else {
        alert("Address Not Found");
      }
    });

  }

  function updateCurrentLocation(pos) {
    console.debug(pos);

    self.currentlyEnteredLocation = pos;
    // App.views.map.jumpToLocation(pos);
    App.views.serviceList.sortLocations(pos);

    return pos;
  }

  return {
    attachLocationButton,
    attachAddressLookupButton,
    getLatLngFromAddress,
    attachSearchInput
  };
};
