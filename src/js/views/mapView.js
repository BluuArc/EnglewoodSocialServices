"use strict";

var App = App || {};

let MapView = function (div) {
  let self = {
    map: null,
    serviceLayer: null,
    currentLocationMarker: null,
    icons: {},

    iconColors: {
      serviceMarker: "#2e84cb",
      serviceMarkerSelected: "#cc852a",
      lotMarker: "#9c2bcb",
      schoolMarker: "#f781bf",
      locationMarker: "#cb2d40"
    },

    markerVisibilityCheck: () => { return true; }, //markers always visible by default
    lotMarkerVisCheck: () => { return true; }, //markers always visible by default
    schoolVisCheck: () => { return true; }, // visible by default

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

    // use mapbox map
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 19,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiYW5kcmV3dGJ1cmtzIiwiYSI6ImNpdnNmcHQ0ejA0azYydHBrc3drYWRwcTgifQ.pCA_a_l6sPcMo8oGzg5stQ'
    }).addTo(self.map);

    
    self.map.setView([41.7750541, -87.6585445], 14);

    self.choroplethLayer = L.layerGroup([]).addTo(self.map);
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
    self.schoolGroup = L.layerGroup([]).addTo(self.map);
    self.map.zoomControl.setPosition('bottomright');
  }

  function drawEnglewoodOutline() {
    //add outline of Englewood
    d3.json("./data/EnglewoodCommunityAreaBoundaries.geojson", function (error, d) {
      console.log(d);
      self.englewoodOutline = L.geoJSON(d, {
        style: function(feature){
          return {
            weight: 3,
            opacity: 0.75,
            fillOpacity: 0.2,
            className: "geoJSON-englewoodOutline fill stroke " + feature.properties.community.toLowerCase().replace(/ /g, '-'),
          }
        }
      }).addTo(self.map);
    });
  }

  // initialize the different icon options by color
  function initIcons() {
    let defaultOptions = {
      fillOpacity: 1,
      circleWeight: 3.5,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    };
    for (let color in self.iconColors) {
      let { ...options} = defaultOptions;

      options.color = self.iconColors[color];
      self.icons[color] = new L.DivIcon.SVGIcon(options);
    }

    const lotColors = {
      Residential: '#8dd3c7',
      BCM: '#ffffb3',
      POS: '#fdb462',
      PD: '#fb8072'
    };
    for(let lotType in lotColors){
      let {...options} = defaultOptions;

      options.color = self.iconColors.lotMarker;
      options.circleFillColor = lotColors[lotType];
      self.icons[lotType] = new L.DivIcon.SVGIcon(options);
    }
  }

  function plotSchools(schoolData) {
    self.schoolGroup.clearLayers();

    console.log("schoolData",schoolData);

    let schoolMarkers = schoolData.map(school => {
      school.visible = true;

      // create a marker for each location
      let curSchool = L.marker(
        L.latLng(+school.Latitude,+school.Longitude),
        {
          icon: self.icons.schoolMarker,
          data: school
        }
      ).bindPopup(() => {
        return `
          <b>${school["Organization Name"]}</b><br>
          ${school.Address}<br>
          ${school.City}, ${school.State}, ${school.Zip}
        `;
      }).addTo(self.schoolGroup).on("mouseover", function (e) {
        if (self.schoolVisCheck()) {
          //open popup forcefully
          if (!this._popup._latlng) {
            this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
          }

          this._popup.openOn(self.map);
        }
      })
      .on("mouseout", function (e) {
        if (!this.options.data.expanded) {
          self.map.closePopup();
        }
      }).on("click", function (e) {
        if (self.schoolVisCheck()) {
          //open popup forcefully
          if (!this._popup._latlng) {
            this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
          }

          this._popup.openOn(self.map);
        }
      });
      curSchool._icon.classList.add("schoolMarker");

      return curSchool;
    });

    if(App.controllers.schoolMarkerView) {
      let schoolMarkerSelection = d3.select("#" + div).selectAll(".leaflet-marker-icon.schoolMarker");
      App.controllers.schoolMarkerView.attachMarkers(schoolMarkers,schoolMarkerSelection);
      self.schoolVisCheck = App.controllers.schoolMarkerView.markersAreVisible;
    }
  }

  function plotLandInventory(landInventoryData){
    self.landInventoryGroup.clearLayers();

    let landMarkers = [];

    // iterate through land inventory data
    for(let lot of landInventoryData){
      lot.visible = true;

      let zoneType = App.models.landInventory.getZoneClassification(lot);
      
      // create a marker for each lot location
      let curLot = L.marker(
        L.latLng(+lot.Latitude, +lot.Longitude), {
          // icon: self.icons.lotMarker,
          icon: self.icons[zoneType !== "Other" ? zoneType : "lotMarker"],
          riseOnHover: true,
          data: lot
        }
      ).bindPopup(function(layer) {
        return `
        <strong>${lot.Location}</strong><br>
        <b>Size: </b> ${lot["Sq. Ft."]} sq. ft.<br>
        <b>Zone Classification: </b>${App.models.landInventory.getZoneClassification(lot, true)}`;
      }).addTo(self.toggleableLotMarkerGroup)
      .on("mouseover", function (e) {
        if (self.lotMarkerVisCheck()) {
          //open popup forcefully
          if (!this._popup._latlng) {
            this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
          }

          this._popup.openOn(self.map);
        }
      })
      .on("mouseout", function (e) {
        if (!this.options.data.expanded) {
          self.map.closePopup();
        }
      }).on("click",function(e){
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
    console.log("serviceData",englewoodLocations);

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
            icon: self.icons.serviceMarker,
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

        curService._icon.classList.add("serviceMarker");
      
        serviceMarkers.push(curService);
    }

    //pass new list to service marker view controller
    if(App.controllers.serviceMarkerView){
      let serviceMarkersSelection = d3.select("#" + div).selectAll('.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive.serviceMarker');
      App.controllers.serviceMarkerView.attachMarkers(serviceMarkers, serviceMarkersSelection);
      self.markerVisibilityCheck = App.controllers.serviceMarkerView.markersAreVisible;
    }

    if(App.controllers.schoolMarkerView){
      App.controllers.schoolMarkerView.raise(); //keep school markers on top
    }
  }

  function updateServicesWithFilter(filteredData, serviceFilters) {
    plotServices(filteredData);
  }

  function setSelectedService(service) {
    console.log(service);
    self.serviceGroup.eachLayer(function (layer) {
      if (service && service["Organization Name"] === layer.options.data["Organization Name"]) {
        layer.setIcon(self.icons.serviceMarkerSelected);

        // open popup forcefully
        if (!layer._popup._latlng) {
          layer._popup.setLatLng(new L.latLng(+layer.options.data.Latitude, +layer.options.data.Longitude));
        }

        layer._popup.openOn(self.map);
      } else {
        // layer.options.data.visible ? layer.setIcon(self.icons.serviceMarker) : layer.setIcon(self.icons["grey"]);
        layer.setIcon(self.icons.serviceMarker)
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
      icon: self.icons.locationMarker,
      zIndexOffset: 200
    });

    self.map.addLayer(self.currentLocationMarker);
  }

  function centerAroundSelection(selection) {
    self.map.fitBounds(selection.bounds);
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

  function getIconColor(name){
    return self.iconColors[name];
  }

  function getIcon(name) {
    return self.icons[name];
  }

  return {
    createMap,
    plotSchools,
    plotLandInventory,
    plotServices,
    updateServicesWithFilter,
    setSelectedService,

    centerAroundSelection,

    drawChoropleth,
    drawEnglewoodOutline,

    jumpToLocation,
    jumpToLocationNoMarker,
    clearLocation,
    fitMapAroundServices,

    getIconColor,
    getIcon
  };
};
