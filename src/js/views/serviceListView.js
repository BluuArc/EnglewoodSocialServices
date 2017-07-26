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
    self.wrapper = d3.select(listWrapperID)
      .style("height", window.innerHeight - d3.select(".navbar").node().clientHeight + "px");

    self.toggleButton = d3.select(buttonID).on("click", function(d) {
      let open = !d3.select(this).classed("open");
      d3.select(this).classed("open", open);

      d3.select(this).select("span").attr("class", open ? "glyphicon glyphicon-eye-close" : "glyphicon glyphicon-eye-open");

      self.wrapper.classed("hidden", !open);

    });
  }

  function resize() {
    let mobile = window.innerWidth < 769;

    self.wrapper
      // .style("")
      .style("height", window.innerHeight - d3.select(".navbar").node().clientHeight + "px");
  }

  function populateList(englewoodLocations) {

    //remove previous entries
    self.serviceList.selectAll(".serviceEntry").remove();

    //add new entries
    self.serviceList.selectAll(".serviceEntry")
      .data(englewoodLocations)
      .enter()
      .append("div").attr("class", "panel panel-info serviceEntry")
      .each(function(d, i) {
        let panel = d3.select(this);
        let theseSubCategories = App.models.serviceTaxonomy.getAllTier2Categories().filter(c => d[c] == 1);

        // create heading
        let panelHeading = panel.append("div")
          .attr("class", "panel-heading")
          .attr("data-parent", "#accordion")
          .attr("data-toggle", "collapse")
          .attr("href", `#service${i}collapse`)
          .on("click", function(d) {
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
        panelHeading.append("h4")
          .attr("class", "orgName")
          .text(function(d) {
            return d["Organization Name"];
          })
        .append("small")
          .attr("class", "type")
          .text(function(d) {
            return _.startCase(d["Type of Organization"]);
          });
        // .append("small")
        //   .attr("class", "serviceDistance")
        //   .html(function(d) {
        //     let theseMainCategories = App.models.serviceTaxonomy.getTier1CategoriesOf(theseSubCategories);
        //
        //     return "<br>" + theseMainCategories.join(", ");
        //   });

        if (self.currentLocation) {
          sortLocations(self.currentLocation);
        }

        // add description to body
        panelBody.append("p")
          .attr("class", "description")
          .text(function(d) {
            return d["Description of Services Provided in Englewood"];
          });

        panelBody.append("p")
          .attr("class", "categories")
          .text(function(d) {
            return theseSubCategories.join(", ");
          });

        // panelBody.append("p")
        //   .attr("class", "proximity")
        //   .text(function(d) {
        //     return d["Proximity to Englewood"];
        //   });

        // add link to address in footer
        panelFooter.append("a")
          .attr("href", "http://maps.google.com/?q=" + d["Address"])
          .attr("target", "_blank")
          .html(function(d) {
            return "<span class='glyphicon glyphicon-share-alt'></span> " +
              d["Address"];
          });

        // phone number
        if (d["Contact Phone Number"]) {
          let phoneRegex = /(\d{3})\D*(\d{3})\D*(\d{4})(x\d+)?/g;
          let match = phoneRegex.exec(d["Contact Phone Number"]);
          let matches = [];

          while (match != null) {
              matches.push(match.slice(1, 5));
              match = phoneRegex.exec(d["Contact Phone Number"]);
          }

          if (matches.length) {
            let numbers = matches.map(connectPhoneNumber);
            panelFooter.append("p")
            .html(function(d) {
              return "<span class='glyphicon glyphicon-earphone'></span> " +
              numbers.join(" or ");
            });
            d["Contact Phone Number"] = numbers;
          }
        }

        // website
        if (d["Website"]) {
          panelFooter.append("a")
          .attr("href", d["Website"])
          .attr("target", "_blank")
          .html(function(d) {
            return "<span class='glyphicon glyphicon-home'></span> " +
            d["Website"];
            // _.truncate(d["Website"], 20);
          });
        }

        panelFooter.append("small")
          .attr("class", "serviceDistance");
      });
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
            lat: a.Y,
            lng: a.X
          };
          let locB = {
            lat: b.Y,
            lng: b.X
          };

          let distA = calculateDistance(locA, currentLocation);
          let distB = calculateDistance(locB, currentLocation);

          return distA - distB;
        })
        .selectAll(".panel-footer")
        .selectAll(".serviceDistance")
        .html(function(d) {
          let loc = {
            lat: d.Y,
            lng: d.X
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
