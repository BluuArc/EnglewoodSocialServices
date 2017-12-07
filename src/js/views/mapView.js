"use strict";

var App = App || {};

let MapView = function (div) {
  let self = {
    map: null,
    serviceLayer: null,
    currentLocationMarker: null,
    icons: {},

    iconColorNames: ["blue", "red", "green", "orange", "yellow", "violet", "grey", "black"],
    iconColors: {
      "blue": "#2e84cb",
      "red": "#cb2d40",
      "green": "#28ad25",
      "orange": "#cc852a",
      "yellow": "#cac428",
      "violet": "#9c2bcb",
      "grey": "#7b7b7b",
      "black": "#3e3e3e"
    },

    rectLayer: null,
    rects: {},
    rectColors: d3.schemeCategory10.slice(0),
    totalRects: 0,

    markerVisibilityCheck: () => { return true; }, //markers always visible by default
    lotMarkerVisCheck: () => { return true; }, //markers always visible by default

    choroplethLayer: null,
    choropleth: null
  };

  init();

  function init() {
    initIcons(); // create icon references for map use
    createMap();
  }

  function createMap() {
    console.log(d3.select("#" + div).node().clientWidth);

    self.map = L.map(div);
    console.log(self.map.getSize());

    if (self.map.getSize().y === 1) {
      alert("Error loading map. Please reload your page");
    }

    // create the map layer using data from openstreetmap
    // var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // normal
    // // var osmUrl = 'http://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'; // dark
    // // var osmUrl = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'; // light

    // var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    // var osm = new L.TileLayer(osmUrl, {
    //   minZoom: 11,
    //   maxZoom: 18,
    //   zoomSnap: 0.25,
    //   zoomDelta: 0.25,
    //   attribution: osmAttrib
    // });
    // self.map.addLayer(osm);


    // use mapbox map
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 19,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiYW5kcmV3dGJ1cmtzIiwiYSI6ImNpdnNmcHQ0ejA0azYydHBrc3drYWRwcTgifQ.pCA_a_l6sPcMo8oGzg5stQ'
    }).addTo(self.map);

    
    self.map.setView([41.7750541, -87.6585445], 14);

    self.choroplethLayer = L.layerGroup([]).addTo(self.map);
    self.rectLayer = L.layerGroup([]).addTo(self.map);
    self.serviceGroup = L.layerGroup([]).addTo(self.map);
    if (L.markerClusterGroup){
      self.landInventoryGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        disableClusteringAtZoom: 19
      }).addTo(self.map);
      self.toggleableLotMarkerGroup = L.featureGroup.subGroup(self.landInventoryGroup).addTo(self.map);
    }else{
      self.landInventoryGroup = L.layerGroup([]).addTo(self.map);
    }
    self.map.zoomControl.setPosition('bottomright');

    // causes map to recalculate size... (I shouldn't need to do this)
    // setTimeout(function() {
    //   self.map.invalidateSize();
    // }, 0);
  }

  function drawEnglewoodOutline() {
    //add outline of Englewood
    d3.json("./data/EnglewoodCommunityAreaBoundaries.geojson", function (error, d) {
      self.englewoodOutline = L.geoJSON(d, {
        style: {
          color: "#006837",
          weight: 3,
          opacity: .75,
          fillColor: '#d9f0a3', //Outline color
          fillOpacity: 0.35,
          className: "geoJSON-englewoodOutline",
        }
      }).addTo(self.map);
    });
  }

  // initialize the different icon options by color
  function initIcons() {
    for (let color of self.iconColorNames) {
      self.icons[color] = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-' + color + '.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }

  }

  function plotLandInventory(landInventoryData){
    self.landInventoryGroup.clearLayers();

    let landMarkers = [];
    let lastHovered = undefined;

    // iterate through land inventory data
    for(let lot of landInventoryData){
      lot.visible = true;

      // create a marker for each lot location
      let curLot = L.marker(
        L.latLng(+lot.Latitude, +lot.Longitude), {
          icon: self.icons[self.iconColorNames[5]],
          riseOnHover: true,
          data: lot
        }
      ).bindPopup(function(layer) {
        return `<strong>${lot.Location}</strong><br><b>Size: </b> ${lot["Sq. Ft."]} sq. ft.`;
      }).addTo(self.toggleableLotMarkerGroup)
      .on("mouseover", function (e) {
        if (!lastHovered && self.lotMarkerVisCheck()) {
          //open popup forcefully
          if (!this._popup._latlng) {
            this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
          }

          this._popup.openOn(self.map);
        }
      })
      .on("mouseout", function (e) {
        if (!lastHovered && !this.options.data.expanded) {
          self.map.closePopup();
        }
      }).on("click",function(e){
        if(e.originalEvent.target === lastHovered){
          lastHovered = undefined;
        }else{
          lastHovered = e.originalEvent.target;
        }

        if (self.lotMarkerVisCheck()) {
          //open popup forcefully
          if (!this._popup._latlng) {
            this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
          }

          this._popup.openOn(self.map);
        }
      });

      landMarkers.push(curLot);
    }

    //pass new list to marker view controller
    if(App.controllers.landMarkerView){
      let landMarkersSelection = function () {
        // used to set the classes of both selections
        // return makes it so that usage is <selection>.classed("classname",true||false) as if it was a d3 selection
        let classed = function (className, state) {
          let clusterMarkerSelection = d3.select("#" + div).selectAll('.leaflet-marker-icon.marker-cluster');
          clusterMarkerSelection.classed(className, state);
          
          let lotMarkerSelection = $(".leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive[src*=violet]");
          if(state){
            lotMarkerSelection.addClass(className);
          }else{
            lotMarkerSelection.removeClass(className);
          }
        };

        return {
          classed
        };
      };
      App.controllers.landMarkerView.attachMarkers(landMarkers, landMarkersSelection);
      self.lotMarkerVisCheck = App.controllers.landMarkerView.markersAreVisible;

      // add/remove layer subgroup on toggle
      App.controllers.landMarkerView.setCustomToggleFunction((state,markerArray,d3Selection) => {
        if(state){
          self.map.addLayer(self.toggleableLotMarkerGroup);
        }else{
          self.map.removeLayer(self.toggleableLotMarkerGroup);
        }
      });
    }
  }

  function plotServices(englewoodLocations) {
    self.serviceGroup.clearLayers();
    let serviceMarkers = [];
    console.log(englewoodLocations);

    // iterate through the social services location file
    for (let loc of englewoodLocations) {
      // convert the X and Y values to lat and lng for clarity
      let lat = +loc.Latitude,
        lng = +loc.Longitude;
      if(isNaN(lat) || isNaN(lng)){
        console.error("Coordinate error with ",loc);
        // loc.Latitude = 0;
        // loc.Longitude = 0;
        lat = lng = 0;
        continue;
      }

      loc.visible = true;


      // create a marker for each social services location
      let curService = L.marker(
          L.latLng(lat, lng), {
            icon: self.icons[self.iconColorNames[0]],
            riseOnHover: true, // moves the marker to the front on mouseover
            // bind data to marker inside options
            data: loc
          }
        ).bindPopup(function (layer) { // allow for the popup on click with the name of the location
          // let phoneRegex = /(\d{3})\D*(\d{3})\D*(\d{4})(x\d+)?/g;
          // let match = phoneRegex.exec(loc["Contact Phone Number"]);
          // let matches = [];

          // while (match != null) {
          //   matches.push(match.slice(1, 5));
          //   match = phoneRegex.exec(loc["Contact Phone Number"]);
          // }

          // matches = matches.map((num) => {
          //   let phone = num.slice(0, 3).join("-");
          //   if (num[3]) {
          //     return [phone, num[3]].join(" ");
          //   }

          //   return phone;
          // });

          
          let addressLink;
          if(loc["Address"] && loc["Address"].length > 0){
            let address = `${loc["Address"]}, ${loc["City"]}, ${loc["State"]}, ${loc["Zip"]}`;
            addressLink = "<strong>" + `<a href='http://maps.google.com/?q=${address} 'target='_blank'>` +
              "<span class='glyphicon glyphicon-share-alt'></span> " + address + "</a></strong><br>";
          }else{
            addressLink = "";
          }

          return "<strong>" + loc["Organization Name"] + "</strong><br>" +
            loc["Description of Services"] + "<br><br>" + addressLink +
            (loc["Phone Number"].length ?
            ("<span class='glyphicon glyphicon-earphone'></span> " + (loc["Phone Number"].join ? loc["Phone Number"].join(" or ") : loc["Phone Number"]) + "</a></strong><br>") : "") +
            (loc["Website"] && loc["Website"].toLowerCase().trim() !== "no website" ?
              ("<strong><a href='" + loc["Website"] + "'target='_blank'>" +
                "<span class='glyphicon glyphicon-home'></span> " + loc["Website"] + "</a></strong><br>") : "");
        }).addTo(self.serviceGroup)
        .on("click", function (e) {
          if (self.markerVisibilityCheck() && this.options.data.visible && App.controllers.listToMapLink) {
            App.controllers.listToMapLink.mapMarkerSelected(this.options.data);
          } else {
            self.map.closePopup();
          }
        })
        .on("mouseover", function (e) {
          if(self.markerVisibilityCheck()){
            // open popup forcefully
            if (!this._popup._latlng) {
              this._popup.setLatLng(new L.latLng(+this.options.data.Latitude, +this.options.data.Longitude));
            }
            
            this._popup.openOn(self.map);
          }
        })
        .on("mouseout", function (e) {
          if (!this.options.data.expanded) {
            self.map.closePopup();
          }
        });
      
        serviceMarkers.push(curService);
    }

    //pass new list to service marker view controller
    if(App.controllers.serviceMarkerView){
      let serviceMarkersSelection = d3.select("#" + div).selectAll('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive');
      App.controllers.serviceMarkerView.attachMarkers(serviceMarkers, serviceMarkersSelection);
      self.markerVisibilityCheck = App.controllers.serviceMarkerView.markersAreVisible;
    }
  }

  function updateServicesWithFilter(filteredData, serviceFilters) {
    plotServices(filteredData);
  }

  function setSelectedService(service) {
    console.log(service);
    self.serviceGroup.eachLayer(function (layer) {
      if (service && service["Organization Name"] === layer.options.data["Organization Name"]) {
        layer.setIcon(self.icons["orange"]);

        // open popup forcefully
        if (!layer._popup._latlng) {
          layer._popup.setLatLng(new L.latLng(+layer.options.data.Latitude, +layer.options.data.Longitude));
        }

        layer._popup.openOn(self.map);
      } else {
        layer.options.data.visible ? layer.setIcon(self.icons["blue"]) : layer.setIcon(self.icons["grey"]);
        // layer.setIcon(self.icons["blue"]);
      }
    });

    if (service) {
      let lat = Number(service.Latitude) + (L.Browser.mobile ? 0.003 : 0);
      let lng = Number(service.Longitude) - ((window.innerWidth > 768) && +d3.select("#serviceListWrapper").style("opacity") ? 0.005 : 0);
      self.map.setView([lat, lng], 16);
    }
  }

  function drawLocationMarker(position) {
    self.currentLocationMarker = L.marker(position, {
      icon: self.icons[self.iconColorNames[1]],
      zIndexOffset: 200
    });

    self.map.addLayer(self.currentLocationMarker);
  }

  function drawRect(bound1, bound2, rectID) {
    let llBound1 = self.map.containerPointToLatLng(bound1);
    let llBound2 = self.map.containerPointToLatLng(bound2);

    let color = self.rectColors.shift();

    if (rectID) {
      if (rectID == 1) {
        color = "#1f77b4";
      } else if (rectID == 2) {
        color = "#ff7f0e";
      }
    }

    let rect = L.rectangle([llBound1, llBound2], {
        color,
        data: rectID || self.totalRects
      })
      // .bindPopup(function (layer) { // allow for the popup on click with the name of the location
      //   return `<button class='btn btn-xs btn-danger' onclick='App.controllers.rectSelector.removeRect(${layer.options.data})'>
      // <span class='glyphicon glyphicon-remove'></span> Remove</button>`;
      // })
      // .setZIndex(200)
      .addTo(self.rectLayer);

    self.rects[rectID || self.totalRects] = rect;

    return {
      id: rectID || self.totalRects++,
      color,
      bounds: [llBound1, llBound2]
    };
  }

  function removeRect(rect) {
    self.rectLayer.removeLayer(self.rects[rect]);
    self.rectColors.push(self.rects[rect].options.color);

    delete self.rects[rect];
  }

  function centerAroundRect(rect) {
    self.map.fitBounds(rect.bounds);
  }

  function drawChoropleth(data, title, options = {}) {
    // remove old choropleth
    if (self.choropleth) {
      self.choroplethLayer.removeLayer(self.choropleth);

      self.englewoodOutline.setStyle({ fillOpacity: 0.35 });
      d3.select("#svgLegend").remove();
    }

    // if data specified, add new choropleth
    if (data) {
      console.log("drawChloropleth",data);
      self.englewoodOutline.setStyle({fillOpacity: 0});
      let description;

      // take ceiling when taking extent so as not to have values equal to 0
      let colorScale = d3.scaleLinear()
        .domain(d3.extent(data.features, f => {
          description = description || (f.properties.description.mainType + ": " + f.properties.description.subType.replace(":",""))
          return Math.ceil(f.properties.data*100)/100;
        })).range(['#9ebcda', '#6e016b']);

      console.log(description);

      //create scale for 5 cells with unit ranges
      let simpleColorScale = d3.scaleLinear()
        .domain([0,4]).range(colorScale.range())
      let colorScaleQ = d3.scaleQuantize()
        .domain(colorScale.domain()).range(d3.range(5).map((i) => simpleColorScale(i)));

      // console.log(colorScale.domain(), colorScale.range());

      let svg = d3.select("#legend").append("svg").attr("width", 160).attr("height", 150)
        .style('background-color',"rgba(150,150,150,0.75)")
        .attr('id','svgLegend');

      let group = svg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(25,20)");

      var legendLinear = d3.legendColor()
        .shapeWidth(30)
        .labelFormat(d3.format(".0f"))
        .title(((title) ? title : "Census Count") + " per census block")
        .titleWidth(120)
        .scale(colorScaleQ);

      svg.select(".legendLinear")
        .call(legendLinear);

      svg.select(".legendTitle")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(55,0)");

      //based off of https://stackoverflow.com/questions/7620509/how-does-one-get-the-height-width-of-an-svg-group-element
      svg.attr("height",+group.node().getBBox().height * 1.1)


      self.choropleth = L.geoJSON(data, {
          style: function (feature) {
            return {
              color: colorScale(feature.properties.data),
              opacity: feature.properties.data === 0 ? 0 : 0.1,
              fillOpacity: feature.properties.data === 0 ? 0 : 0.75,
              className: "geoJSON-gridSpace"
            }
          }
        })
        .on("mouseover", function (geojson) {
          // console.log(layer);
          geojson.layer.bringToFront();
        })
        .on("click", function(geojson){
          // console.log(geojson.layer);
          if(typeof options.clickHandler === "function"){
            options.clickHandler(geojson.layer);
          }
        })
        // .on("mouseout", function(geojson) {
        //   // console.log(layer);
        //   geojson.layer.bringToBack();
        // })
        .bindPopup(function (layer) {
          // console.log(layer.feature.properties.data);
          let data = layer.feature.properties.data;
          let description = layer.feature.properties.description;
          let mainTypeTitle = description.mainType.split("_").map((d) => {
            return `${d[0].toUpperCase()}${d.slice(1).toLowerCase()}`;
          }).join(" ");
          let subTypeTitle = `${description.subType.replace(/[^a-zA-Z0-9- ]/g, "")}`;
          return `<b>Count of <em>${mainTypeTitle} - ${subTypeTitle}</em> on this block:</b> ${layer.feature.properties.data}`;
        }).addTo(self.choroplethLayer);

      self.rectLayer.eachLayer(rect => {
        if(rect) {
          rect.bringToFront();
        }
      });
    }

  }

  function jumpToLocation(position) {
    //remove previous circle marker
    if (self.currentLocationMarker != undefined)
      self.map.removeLayer(self.currentLocationMarker);

    //move map to new poisition
    self.map.setView([position.lat, position.lng], 16);

    //draw a circle marker at new position
    drawLocationMarker(position);
  }

  function jumpToLocationNoMarker(position) {
    //remove previous circle marker
    if (self.currentLocationMarker != undefined)
      self.map.removeLayer(self.currentLocationMarker);

    //move map to new poisition
    // self.map.setView([position.lat, position.lng], 16);

    let lat = Number(position.lat) + (L.Browser.mobile ? 0.003 : 0);
    let lng = Number(position.lng) - ((window.innerWidth > 768) && +d3.select("#serviceListWrapper").style("opacity") ? 0.005 : 0);
    self.map.setView([lat, lng], 14);
  }

  function fitMapAroundServices(pos) {
    
    if (self.currentLocationMarker != undefined)
      self.map.removeLayer(self.currentLocationMarker);
    
    var markerArray = [];

    if (pos) {
      drawLocationMarker(pos);
      markerArray.push(self.currentLocationMarker);
    }

    self.serviceGroup.eachLayer(function (layer) {
      if (layer.options.data &&
        Number(layer.options.data.Latitude) &&
        Number(layer.options.data.Longitude) &&
        _.includes(layer.options.data.State, "IL")) {
        markerArray.push(layer);
      }
    });

    var group = L.featureGroup(markerArray);
    try{
      self.map.fitBounds(group.getBounds());
    }catch(err){
      console.error(err);
    }
  }

  function clearLocation() {
    if (self.currentLocationMarker != undefined)
      self.map.removeLayer(self.currentLocationMarker);

    self.map.setView([41.779786, -87.644778], 15);

  }

  return {
    createMap,
    plotLandInventory,
    plotServices,
    updateServicesWithFilter,
    setSelectedService,

    drawRect,
    removeRect,
    centerAroundRect,

    drawChoropleth,
    drawEnglewoodOutline,

    jumpToLocation,
    jumpToLocationNoMarker,
    clearLocation,
    fitMapAroundServices
  };
};