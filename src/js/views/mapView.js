/* global d3 L _ $ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let MapView = function (div) {
  let self = {
    map: null,
    serviceLayer: null,
    currentLocationMarker: null,
    icons: {},
    smallIcons: {},

    iconColors: {
      serviceMarker: '#2e84cb',
      serviceMarkerSelected: '#cc852a',
      lotMarker: '#9c2bcb',
      schoolMarker: '#b15928',
      locationMarker: '#cb2d40'
    },
    lotColors: {
      Residential: '#999999',
      BCM: '#ff7f00',
      POS: '#4daf4a',
      PD: '#e78ac3'
    },

    markerVisibilityCheck: () => { return true; }, //markers always visible by default
    lotTypeMarkerVisCheck: () => { return true; }, //markers always visible by default
    schoolVisCheck: () => { return true; }, // visible by default

    choroplethLayer: null,
    choropleth: null,

    serviceLocations: {},
  };

  init();

  function init() {
    initIcons(); // create icon references for map use
    createMap();
  }

  function createMap() {
    console.debug(d3.select('#' + div).node().clientWidth);

    self.map = L.map(div);
    console.debug(self.map.getSize());

    if (self.map.getSize().y === 1) {
      alert('Error loading map. Please reload your page');
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
      self.lotTypeClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        disableClusteringAtZoom: 18
      }).addTo(self.map);

      self.groupResidential = L.featureGroup.subGroup(self.lotTypeClusterGroup).addTo(self.map);
      self.groupBCM = L.featureGroup.subGroup(self.lotTypeClusterGroup).addTo(self.map);
      self.groupPOS = L.featureGroup.subGroup(self.lotTypeClusterGroup).addTo(self.map);
      self.groupPD = L.featureGroup.subGroup(self.lotTypeClusterGroup).addTo(self.map);

      self.lotTypeClusterGroup.on('clustermouseover', function() {
        console.debug(arguments);
      });
    }else{
      self.lotTypeClusterGroup = L.layerGroup([]).addTo(self.map);
    }
    self.schoolGroup = L.layerGroup([]).addTo(self.map);
    self.map.zoomControl.setPosition('bottomright');

    if(d3.legendColor) {
      drawLegend();
    }
  }

  function drawEnglewoodOutline() {
    //add outline of Englewood
    d3.json('./data/EnglewoodCommunityAreaBoundaries.geojson', function (error, d) {
      console.debug(d);
      self.englewoodOutline = L.geoJSON(d, {
        style: function(feature){
          return {
            weight: 3,
            opacity: 0.75,
            fillOpacity: 0.2,
            className: 'geoJSON-englewoodOutline fill stroke ' + feature.properties.community.toLowerCase().replace(/ /g, '-'),
          };
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
    const smallIconSize = [14, 23];
    const smallCircleRatio = 0.60;
    for (let color in self.iconColors) {
      let { ...options} = defaultOptions;

      options.color = self.iconColors[color];
      self.icons[color] = new L.DivIcon.SVGIcon(options);

      options.iconSize = smallIconSize;
      options.circleRatio = smallCircleRatio;
      options.circleRatio = smallCircleRatio;
      self.smallIcons[color] = new L.DivIcon.SVGIcon(options);
    }

    for(let lotType in self.lotColors){
      let {...options} = defaultOptions;

      options.color = self.iconColors.lotMarker;
      options.fillColor = self.lotColors[lotType];
      options.weight = 3;
      options.circleColor = options.fillColor;
      self.icons[lotType] = new L.DivIcon.SVGIcon(options);

      options.iconSize = smallIconSize;
      options.circleRatio = smallCircleRatio;
      options.weight = 1.5;
      self.smallIcons[lotType] = new L.DivIcon.SVGIcon(options);
    }

    let {...schoolOptions} = defaultOptions;
    schoolOptions.fillColor = self.iconColors.schoolMarker;
    schoolOptions.color = self.iconColors.serviceMarker;
    schoolOptions.weight = 3;
    schoolOptions.circleColor = schoolOptions.fillColor;
    self.icons.schoolServiceMarker = new L.DivIcon.SVGIcon(schoolOptions);

    schoolOptions.iconSize = smallIconSize;
    schoolOptions.circleRatio = smallCircleRatio;
    self.smallIcons.schoolServiceMarker = new L.DivIcon.SVGIcon(schoolOptions);
  }

  function plotSchools(schoolData) {
    self.schoolGroup.clearLayers();

    console.debug('schoolData',schoolData);

    schoolData.map(school => {
      school.visible = true;

      let locationKey = `${school.Latitude},${school.Longitude}`, isService = false;
      if (self.serviceLocations[locationKey]) {
        isService = true;
        console.debug('School/service overlap at', locationKey, self.serviceLocations[locationKey], school);
      }

      // create a marker for each location
      let curSchool = L.marker(
        L.latLng(+school.Latitude,+school.Longitude),
        {
          icon: isService ? self.icons.schoolServiceMarker : self.icons.schoolMarker,
          data: school
        }
      ).bindPopup(() => {
        return `
          <b>${school['Organization Name']}</b><br>
          ${school.Address}<br>
          ${school.City}, ${school.State}, ${school.Zip}
        `;
      }, { autoPan: false }).addTo(self.schoolGroup).on('mouseover', function () {
        if (self.schoolVisCheck()) {
          //open popup forcefully
          if (!this._popup._latlng) {
            this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
          }

          this._popup.openOn(self.map);
        }
      })
        .on('mouseout', function () {
          if (!this.options.data.expanded) {
            self.map.closePopup();
          }
        }).on('click', function () {
          if (self.schoolVisCheck()) {
            console.debug(school);
            //open popup forcefully
            if (!this._popup._latlng) {
              this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
            }

            this._popup.openOn(self.map);
          }
        });
      curSchool._icon.classList.add('schoolMarker');

      return curSchool;
    });

    App.controllers.schoolMarkerView.attachMap(self.map);
    App.controllers.schoolMarkerView.attachMarkerGroup(self.schoolGroup);
  }

  function plotLandInventory(landInventoryData){
    self.lotTypeClusterGroup.clearLayers();
    const zoneTypes = Object.keys(self.lotColors);

    let markerInit = (marker, lot) => {
      return marker.bindPopup(function () {
        return `
        <strong>${lot.Location}</strong><br>
        <b>Size: </b> ${lot['Sq. Ft.']} sq. ft.<br>
        <b>Zone Classification: </b>${App.models.landInventory.getZoneClassification(lot, true)}`;
      }, { autoPan: false }).on('mouseout', function () {
        if (!this.options.data.expanded) {
          self.map.closePopup();
        }
      });
    };

    // iterate through land inventory data
    for(let lot of landInventoryData){
      lot.visible = true;

      let zoneType = App.models.landInventory.getZoneClassification(lot);
      
      // create a marker for each lot location
      if(self[`group${zoneType}`]) {
        let lotMarker = markerInit(
          L.marker(
            L.latLng(+lot.Latitude, +lot.Longitude),
            {
              // icon: self.icons.lotMarker,
              icon: self.icons[zoneType !== 'Other' ? zoneType : 'lotMarker'],
              riseOnHover: true,
              data: lot
            }
          ),
          lot
        ).on('mouseover', function () {
          if (self.lotTypeMarkerVisCheck()) {
            //open popup forcefully
            if (!this._popup._latlng) {
              this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
            }

            this._popup.openOn(self.map);
          }
        }).on('click', function () {
          if (self.lotTypeMarkerVisCheck()) {
            //open popup forcefully
            if (!this._popup._latlng) {
              this._popup.setLatLng(new L.latLng(this.options.data.Latitude, this.options.data.Longitude));
            }

            this._popup.openOn(self.map);
          }
        });
        lotMarker.addTo(self[`group${zoneType}`]);
      }else {
        console.error('Ignoring marker',lot,'due to unknown type', zoneType);
      }
    }

    zoneTypes.forEach(zt => {
      const controller = App.controllers[`lotView${zt}`];
      controller.attachMap(self.map);
      controller.attachMarkerGroup(self[`group${zt}`]);
    });
  }

  function plotServices(englewoodLocations) {
    self.serviceGroup.clearLayers();
    let serviceMarkers = [];
    console.debug({ englewoodLocations });

    // iterate through the social services location file
    for (let loc of englewoodLocations) {
      // convert the X and Y values to lat and lng for clarity
      let lat = +loc.Latitude,
        lng = +loc.Longitude;
      if(isNaN(lat) || isNaN(lng)){
        console.error('Coordinate error with ',loc);
        // loc.Latitude = 0;
        // loc.Longitude = 0;
        lat = lng = 0;
        continue;
      }

      loc.visible = true;

      let locationKey = `${loc.Latitude},${loc.Longitude}`;
      if (!self.serviceLocations[locationKey]) {
        self.serviceLocations[locationKey] = [loc];
      } else if (self.serviceLocations[locationKey].map(val => val['Organization Name']).indexOf(loc['Organization Name']) === -1){
        self.serviceLocations[locationKey].push(loc);
      }


      // create a marker for each social services location
      let curService = L.marker(
        L.latLng(lat, lng), {
          icon: self.icons.serviceMarker,
          riseOnHover: true, // moves the marker to the front on mouseover
          // bind data to marker inside options
          data: loc
        }
      ).bindPopup(function () { // allow for the popup on click with the name of the location
        let addressLink;
        if(loc['Address'] && loc['Address'].length > 0){
          let address = `${loc['Address']}, ${loc['City']}, ${loc['State']}, ${loc['Zip']}`;
          addressLink = '<strong>' + `<a href='http://maps.google.com/?q=${address} 'target='_blank'>` +
              '<span class=\'glyphicon glyphicon-share-alt\'></span> ' + address + '</a></strong><br>';
        }else{
          addressLink = '';
        }

        return '<strong>' + loc['Organization Name'] + '</strong><br>' +
            loc['Description of Services'] + '<br><br>' + addressLink +
            (loc['Phone Number'].length ?
              ('<span class=\'glyphicon glyphicon-earphone\'></span> ' + (loc['Phone Number'].join ? loc['Phone Number'].join(' or ') : loc['Phone Number']) + '</a></strong><br>') : '') +
            (loc['Website'] && loc['Website'].toLowerCase().trim() !== 'no website' ?
              ('<strong><a href=\'' + loc['Website'] + '\'target=\'_blank\'>' +
                '<span class=\'glyphicon glyphicon-home\'></span> ' + loc['Website'] + '</a></strong><br>') : '');
      }, { autoPan: false }).addTo(self.serviceGroup)
        .on('click', function () {
          if (self.markerVisibilityCheck() && this.options.data.visible && App.controllers.listToMapLink) {
            App.controllers.listToMapLink.mapMarkerSelected(this.options.data);
          } else {
            self.map.closePopup();
          }
        })
        .on('mouseover', function () {
          if(self.markerVisibilityCheck()){
            // open popup forcefully
            if (!this._popup._latlng) {
              this._popup.setLatLng(new L.latLng(+this.options.data.Latitude, +this.options.data.Longitude));
            }
            
            this._popup.openOn(self.map);
          }
        })
        .on('mouseout', function () {
          if (!this.options.data.expanded) {
            self.map.closePopup();
          }
        });

      curService._icon.classList.add('serviceMarker');
      
      serviceMarkers.push(curService);
    }

    for(let location in self.serviceLocations){
      if(self.serviceLocations[location].length > 1){
        console.debug('Service overlap at', location, self.serviceLocations[location]);
      }
    }

    //pass new list to service marker view controller
    if(App.controllers.serviceMarkerView){
      App.controllers.serviceMarkerView.attachMap(self.map);
      App.controllers.serviceMarkerView.attachMarkerGroup(self.serviceGroup);
    }
  }

  function updateServicesWithFilter(filteredData) {
    plotServices(filteredData);
  }

  function setSelectedService(service) {
    console.debug(service);
    self.serviceGroup.eachLayer(function (layer) {
      if (service && service['Organization Name'] === layer.options.data['Organization Name']) {
        layer.setIcon(self.icons.serviceMarkerSelected);

        // open popup forcefully
        if (!layer._popup._latlng) {
          layer._popup.setLatLng(new L.latLng(+layer.options.data.Latitude, +layer.options.data.Longitude));
        }

        layer._popup.openOn(self.map);
      } else {
        // layer.options.data.visible ? layer.setIcon(self.icons.serviceMarker) : layer.setIcon(self.icons["grey"]);
        layer.setIcon(self.icons.serviceMarker);
        // layer.setIcon(self.icons["blue"]);
      }
    });

    if (service) {
      let lat = Number(service.Latitude) + (L.Browser.mobile ? 0.003 : 0);
      let lng = Number(service.Longitude) - ((window.innerWidth > 768) && +d3.select('#serviceListWrapper').style('opacity') ? 0.005 : 0);
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

  function drawLegend(censusOptions) {
    if (App.views.mapLegend) {
      App.views.mapLegend.drawSVG(censusOptions);
    }
  }

  function drawChoropleth(data, title, options = {}) {
    // remove old choropleth
    if (self.choropleth) {
      $('div').off('click', '.btn.popup-btn');
      self.choroplethLayer.removeLayer(self.choropleth);

      self.englewoodOutline.setStyle({ fillOpacity: 0.35 });
      drawLegend();
    }

    // if data specified, add new choropleth
    if (data) {
      console.debug('drawChloropleth',data);
      self.englewoodOutline.setStyle({fillOpacity: 0});
      let description;

      // take ceiling when taking extent so as not to have values equal to 0
      let colorScale = d3.scaleLinear()
        .domain(d3.extent(data.features, f => {
          description = description || (f.properties.description.mainType + ': ' + f.properties.description.subType.replace(':',''));
          return Math.ceil(f.properties.data*100)/100;
        })).range(['#9ebcda', '#6e016b']);

      console.debug(description);

      //create scale for 5 cells with unit ranges
      let simpleColorScale = d3.scaleLinear()
        .domain([0,4]).range(colorScale.range());
      let colorScaleQ = d3.scaleQuantize()
        .domain(colorScale.domain()).range(d3.range(5).map((i) => simpleColorScale(i)));
      
      drawLegend({ colorScale: colorScaleQ, title });

      self.choropleth = L.geoJSON(data, {
        style: function (feature) {
          return {
            color: colorScale(feature.properties.data),
            opacity: feature.properties.data === 0 ? 0 : 0.1,
            fillOpacity: feature.properties.data === 0 ? 0 : 0.75,
            className: `geoJSON-gridSpace geoJSON-gridSpace--${feature.properties.geoId}`
          };
        }
      })
        .on('mouseover', function (geojson) {
          geojson.layer.bringToFront();

          if (typeof options.hoverHandler === 'function') {
            options.hoverHandler(geojson.layer);
          }
        })
        .on('click', function(geojson){
          console.debug(geojson);
          if(typeof options.clickHandler === 'function'){
            options.clickHandler(geojson.layer);
          }
        })
        // .on("mouseout", function(geojson) {
        //   // console.debug(layer);
        //   geojson.layer.bringToBack();
        // })
        .bindPopup(function (layer) {
          console.debug(layer.feature.properties.data);
          const data = layer.feature.properties;
          const title = ((property_data) => {
            let title = '';
            if (property_data.subType.indexOf('Total') > -1) {
              title = `${_.startCase(property_data.mainType.replace(/_/g,' ').toLowerCase())}: ${property_data.subType}`;
            } else if (property_data.mainType.toLowerCase().replace(/_/g, ' ').indexOf('sex by age') > -1) {
              const type = property_data.mainType.split('(')[1].split(')')[0].toLowerCase();
              title = `${_.startCase(type)}: ${property_data.subType}`;
            } else {
              title = property_data.subType;
            }
            return title;
          })(data.description);
          const svgData = App.controllers.mapData.getCensusSVG();
          let html;
          if (svgData) {
            if (typeof options.popupButtonClickHandler === 'function') {
              console.debug('initializing click handler');
              $('div').off('click', '.btn.popup-btn')
                .on('click', '.btn.popup-btn', _.debounce((e) => {
                  e.preventDefault();
                  console.debug('clicked popup button');
                  options.popupButtonClickHandler(layer);
                }, 25));
            }
            const modifiedData = d3.select(svgData.node().cloneNode())
              .style('transform', 'scale(0.75)')
              .style('width', 'fit-content');
            modifiedData.html(svgData.html());
            modifiedData.selectAll('g')
              .style('transform', 'translateX(0px) translateY(5px)');
            html = `
            <div class="container-fluid">
              <div class="row">
                <u><b>${title}</b></u><br><b>${data.blockName}</b><br>
                <br>${data.data} ${data.data == 1 ? 'person' : 'people'} in this block
              </div>
              <div class="row" style="margin: auto; height: ${$(modifiedData.node()).height() * 2/3}px; width: ${$(modifiedData.node()).height() * 2/3}px">
                <svg height="${modifiedData.attr('height')}" width="${$(modifiedData.node()).height() * 2 / 3 + 5}">${modifiedData.html()}</svg>
              </div>
              <div class="row">
                <button class="btn btn-primary btn-block popup-btn">Add to comparison</button>
              </div>
            </div>
            `;
          } else {
            html = `
            <div class="container-fluid">
              <div class="row">
                <u><b>${title}</b></u><br><b>${data.blockName}</b><br>
                <br>${data.data} ${data.data == 1 ? 'person' : 'people'} in this block
              </div>
            </div>
            `;
          }
          return html;
        }, {
          autoPan: false,
          minWidth: 200,
          minHeight: 200
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
    let lng = Number(position.lng) - ((window.innerWidth > 768) && +d3.select('#serviceListWrapper').style('opacity') ? 0.005 : 0);
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
        _.includes(layer.options.data.State, 'IL')) {
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
    return self.iconColors[name] || self.lotColors[name];
  }

  function getIcon(name) {
    return self.icons[name];
  }

  function getSmallIcon(name) {
    return self.smallIcons[name];
  }

  return {
    createMap,
    plotSchools,
    plotLandInventory,
    plotServices,
    updateServicesWithFilter,
    setSelectedService,

    centerAroundSelection,

    drawLegend,
    drawChoropleth,
    drawEnglewoodOutline,

    jumpToLocation,
    jumpToLocationNoMarker,
    clearLocation,
    fitMapAroundServices,

    getIconColor,
    getIcon,
    getSmallIcon
  };
};
