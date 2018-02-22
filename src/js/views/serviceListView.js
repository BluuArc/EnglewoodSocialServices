"use strict";

var App = App || {};

let ServiceListView = function(listID) {
  let self = {
    serviceList: null,
    toggleButton: null,
    wrapper: null,

    currentLocation: null
  };

  init();

  function init() {
    self.serviceList = d3.select(listID).select("#accordion");
  }

  function makeCollapsing(buttonID, listWrapperID) {
    let mobile = window.innerWidth < 769;

    // let startOpen = !mobile;
    let startOpen = true;

    self.wrapper = d3.select(listWrapperID)
      .style("pointer-events", startOpen ? "all" : "none")
      .style("opacity", startOpen ? 1 : 0)
      .style("height", window.innerHeight - d3.select(".navbar").node().clientHeight + "px");

    self.toggleButton = d3.select(buttonID).classed("open", startOpen)
      .on("click", function(d) {
        let open = !d3.select(this).classed("open");
        d3.select(this).classed("open", open);

        d3.select(this).select(".glyphicon").attr("class", open ? "glyphicon glyphicon-eye-close" : "glyphicon glyphicon-eye-open");
        if(open){
          document.getElementById("serviceListButtonText").innerHTML="Hide Service List";
        }
        else{
          document.getElementById("serviceListButtonText").innerHTML="Show Service List";
        }
        
        self.wrapper
          .style("pointer-events", open ? "all" : "none")
          .style("opacity", open ? 1 : 0);
      });
  }

  function resize() {
    let mobile = window.innerWidth < 769;

    self.wrapper
      .style("height", window.innerHeight - d3.select(".navbar").node().clientHeight + "px");
  }

  function toggleDescription(elem, target, mode = "toggle") {
    target.collapse(mode);
    
    return new Promise((fulfill,reject) => {
      target.on('shown.bs.collapse', () => {
        elem.classed("collapsed", false);
        target.off('shown.bs.collapse');
        fulfill();
      });
      target.on('hidden.bs.collapse', () => {
        elem.classed("collapsed", true);
        target.off('hidden.bs.collapse');
        fulfill();
      });
    });
  }

  function populateList(englewoodLocations, options) {
    console.debug(options);

    if(options) {
      let html = "Services";

      if (options.service && !options.service.includes("Select Services...")) {
        html += ` of type <span class='bread-crumb'>'${options.service}'</span>`;
      }

      if (options.address) {
        html += ` around <span class='bread-crumb'>'${options.address}'</span>`;
      }

      if (options.search) {
        html += ` named <span class='bread-crumb'>'${options.search}'</span>`;
      }

      html += ":";

      self.wrapper.select(".title").html(html);
    }

    let knownNames = englewoodLocations.map((d) => { return d["Organization Name"]; });
    console.debug(knownNames);

    //remove previous entries
    // self.serviceList.selectAll(".serviceEntry").remove();

    let selection = self.serviceList.selectAll(".serviceEntry");
    if(selection.empty()){
      //add new entries
      console.info("Populating service list");
      selection.data(englewoodLocations)
        .enter()
        .append("div").attr("class", "panel panel-info serviceEntry")
        .each(function (d, i) {
          let panel = d3.select(this);
          let inCategories = (() => {
            let categories = {};
            App.models.serviceTaxonomy.getTier1Categories().forEach(m => {
              categories[m] = App.models.serviceTaxonomy.getTier2CategoriesOf(m).filter(s => d[s] == 1);
            });
            return categories;
          })();
          let theseSubCategories = App.models.serviceTaxonomy.getAllTier2Categories().filter(c => d[c] == 1);

          // create heading
          let panelHeading = panel.append("div")
            .attr("class", "panel-heading collapsed")
            .attr("data-parent", "#accordion")
            .attr("data-toggle", "collapse")
            .attr("href", `#service${i}collapse`)
            .on("click", function (d) {
              let expanded = !panel.selectAll(".collapse").classed("in");

              self.serviceList.selectAll(".serviceEntry").classed("opened", false);
              panel.classed("opened", expanded);

              App.controllers.listToMapLink.listServiceSelected(expanded ? d : null);
            });

          // create body
          let panelBody = panel.append("div")
            .attr("class", "panel-collapse collapse")
            .attr("id", `service${i}collapse`)
            .append("div")
            .attr("class", "panel-body");

          // create footer
          let panelFooter = panel.append("div")
            .attr("class", "panel-footer");

          // add organization name to heading
          panelHeading.append("small")
            .attr("class", "detailText")
            .text("Details");
            
          panelHeading.append("h4")
            .attr("class", "orgName")
            .text(function (d) {
              return d["Organization Name"];
            })
            .append("small")
            .attr("class", "type")
            .text(function (d) {
              return _.startCase(d["Type of Organization"]);
            });
            
          // add description to body
          panelBody.append("p")
            .classed("description-title", true)
            .text("Description")
            .on('click', function(){
              toggleDescription(d3.select(this), $(panelBody.node()).find(".description"), "toggle");
            });
          panelBody.append("p")
            .attr("class", "description")
            .text(function (d) {
              return d["Description of Services"];
            });

          panelBody.append("p")
            .classed("categories-title", true)
            .text(`All Categories (${theseSubCategories.length})`)
            .on('click', function () {
              toggleDescription(d3.select(this), $(panelBody.node()).find(".categories"), "toggle");
            });
          panelBody.append("ul")
            .attr("class", "categories")
            .html(function (d) {
              let lines = [];
              for(let mainCategory in inCategories){
                for(let subCategory of inCategories[mainCategory]){
                  lines.push(`<li>${mainCategory} - ${subCategory}</li>`);
                }
              }
              return lines.join('');
            });

          // add link to address in footer
          if(d["Address"] && d["Address"].length > 0 && d.Latitude.length > 0 && d.Longitude.length > 0){
            let address = `${d.Address}, ${d.City}, ${d.State}, ${d.Zip}`;
            panelFooter.append("a")
              .attr("href", "http://maps.google.com/?q=" + address)
              .attr("target", "_blank")
              .html(function (d) {
                return "<span class='glyphicon glyphicon-share-alt'></span> " +
                  address;
              });
          }else{
            panelFooter.append("p")
              .html("<span class='glyphicon glyphicon-share-alt'></span> No physical location");
          }

          // phone number
          if (d["Phone Number"]) {
            let phoneRegex = /(\d{3})\D*(\d{3})\D*(\d{4})(x\d+)?/g;
            let match = phoneRegex.exec(d["Phone Number"]);
            let matches = [];

            while (match != null) {
              matches.push(match.slice(1, 5));
              match = phoneRegex.exec(d["Phone Number"]);
            }

            if (matches.length) {
              let numbers = matches.map(connectPhoneNumber);
              panelFooter.append("p")
                .html(function (d) {
                  return "<span class='glyphicon glyphicon-earphone'></span> " +
                    numbers.join(" or ");
                });
              d["Phone Number"] = numbers;
            }else{
              console.debug(d["Phone Number"]);
            }
          }

          // website
          if (d["Website"] && d["Website"].toLowerCase().trim() !== "no website") {
            panelFooter.append("a")
              .attr("href", d["Website"])
              .attr("target", "_blank")
              .html(function (d) {
                return "<span class='glyphicon glyphicon-home'></span> <span>" +
                  d["Website"] + "</span>";
                // _.truncate(d["Website"], 20);
              });
          }

          panelFooter.append("small")
            .attr("class", "serviceDistance");
        });

      // initialize collapsibles
      self.serviceList.selectAll(".serviceEntry .panel-body")
        .each(function(){
          let d3Elem = d3.select(this);
          let $elem = $(this);
          toggleDescription(d3Elem.select(".descripton-title"), $elem.find(".description"), "show");

          toggleDescription(d3Elem.select(".categories-title"), $elem.find(".categories"), "show")
          // initialize with categories list closed
            // .then(() => toggleDescription(d3Elem.select(".categories-title"), $elem.find(".categories"), "toggle"));
        });

    }else{
      console.info("Filtering services");
      selection
        .style('display',function(d,i) {
          if(knownNames.indexOf(d["Organization Name"]) === -1){
            return 'none';
          }else{
            return null;
          }
        })
    }

    if (self.currentLocation) {
      sortLocations(self.currentLocation);
    }

  }

  function connectPhoneNumber(arr) {
    let phone = arr.slice(0, 3).join("-");
    if (arr[3]) {
      return [phone, arr[3]].join(" ");
    }

    return phone;
  }

  function sortLocations(currentLocation) {
    self.currentLocation = currentLocation;

    if (!currentLocation) {
      self.serviceList.selectAll(".serviceEntry")
        .selectAll(".panel-footer")
        .selectAll(".serviceDistance")
        .text("");
    } else {
      self.serviceList.selectAll(".serviceEntry")
        .sort(function(a, b) {
          let locA = {
            lat: +a.Latitude,
            lng: +a.Longitude
          };
          let locB = {
            lat: +b.Latitude,
            lng: +b.Longitude
          };

          let distA = calculateDistance(locA, currentLocation);
          let distB = calculateDistance(locB, currentLocation);

          return distA - distB;
        })
        .selectAll(".panel-footer")
        .selectAll(".serviceDistance")
        .html(function(d) {
          let loc = {
            lat: +d.Latitude,
            lng: +d.Longitude
          };

          return "<br>" + calculateDistance(loc, currentLocation).toFixed(2) + " mi.";
        });
    }

  }

  function calculateDistance(pos1, pos2) {
    const R = 3959; // meters
    let φ1 = toRadians(pos1.lat);
    let φ2 = toRadians(pos2.lat);
    let Δφ = toRadians(pos2.lat - pos1.lat);
    let Δλ = toRadians(pos2.lng - pos1.lng);

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let d = R * c;

    return d;

    function toRadians(deg) {
      return deg * Math.PI / 180;
    }
  }

  return {
    populateList,

    sortLocations,
    makeCollapsing,

    resize
  };
};
