"use strict";

let MapDataController = function () {
  let self = {
    dataDropdownList: null,

    toggleButton: null,
    mapDataPanel: null,
    resetButton: null,
    censusResetButton: null,
    censusDropdownButton: null,
    censusDropdownList: null,
    data: null,

    filters: {}, // equivalent to subcategory states

    mainCategoryStates: {},
    mainStateToIcon: {
      "none": "glyphicon-unchecked",
      "some": "glyphicon-plus",
      "all": "glyphicon-check"
    }
  };

  function setDataDropdown(id) {
    self.dataDropdownList = d3.select(id);
  }

  function setCensusClearButton() {
    self.censusResetButton = d3.selectAll("#allCensusButton")
      .on('click', resetFilters);

    self.censusDropdownButton = d3.select("#censusDropdownButton");

    self.censusDropdownList = d3.select("#censusDropdownList");
  }

  function setupDataPanel(buttonID, listWrapperID) {
    self.mapDataPanel = d3.select(listWrapperID)
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("height", window.innerHeight - d3.select(".navbar").node().clientHeight + "px");

    self.toggleButton = d3.select(buttonID).classed("open", false)
      .on("click", function (d) {
        let open = !d3.select(this).classed("open");
        d3.select(this).classed("open", open);

        d3.select(this).select(".glyphicon").attr("class", open ? "glyphicon glyphicon-arrow-up" : "glyphicon glyphicon-arrow-down");

        self.mapDataPanel
          .style("pointer-events", open ? "all" : "none")
          .style("opacity", open ? 1 : 0);
      });
  }

  function attachResetOverlayButton(id) {
    self.resetButton = d3.select(id)
      .on("click", resetOverlay);
  }

  function resetOverlay() {
    self.mapDataPanel.selectAll(".mapButton").each(removeMap);
    App.views.map.drawChoropleth();
    console.log("Reset Overlay");
  }

  function resetFilters() {
    console.log("Reset Filters");

    let current_census_properties = {
      type: "census"
    };

    current_census_properties.subType = (Object.keys(self.filters).length === 1) ? Object.keys(self.filters)[0].split("||")[1] : "All";
    
    self.filters = {};

    console.log(self.mainCategoryStates)
    for (let mainCategory of Object.keys(self.mainCategoryStates)) {
      if (self.mainCategoryStates[mainCategory] !== "none") {
        current_census_properties.mainType = mainCategory;
      }
      self.mainCategoryStates[mainCategory] = "none";
    }

    console.log("current_census_properties", current_census_properties);
    console.trace();
    if(current_census_properties.mainType)
      App.views.chartList.removePropertyChart(current_census_properties);

    removeMap();

    self.censusDropdownList.selectAll(".glyphicon")
      .attr("class", "glyphicon glyphicon-unchecked");

    self.censusDropdownButton.selectAll('#currentServiceSelection').text("Select Census Category...");
    self.censusDropdownButton.attr("class", "btn btn-default dropdown-toggle");

    self.censusResetButton.selectAll('#currentServiceSelection').text("Clear Selection");
    // self.censusResetButton.attr('disabled',true);
    document.getElementById("allCensusButton").style.display = "none";
  }

  function getFilterKey(mainType,subType){
    return `${mainType}||${subType}`; //remove any non-alpha numberic characters except underscores
  }

  function populateDropdown(categories, max_height) {
    self.data = categories;
    let tier1Categories = Object.keys(categories);

    for (let category of tier1Categories) {
      self.mainCategoryStates[category] = "none"; // "some", "all"
    }

    self.censusDropdownList.selectAll(".mainType")
      .data(tier1Categories)
      .enter().append("li")
      .attr("class", "dropdown-submenu serviceType")
      .each(function (c1) {
        var title = c1;
        title = title.toLowerCase();
        title = title.replace(/_/g, ' ');

        let listItem = d3.select(this);
        let btnGroup = listItem.append("div").classed("btn-group row", true);
        
        // create link within tab
        let totalBtn = btnGroup.append("button").classed("btn btn-item col-md-10", true)
          .attr("tabindex", -1)
          .attr("id", "main_" + convertPropertyToID(c1))
          .html("<span class='glyphicon glyphicon-unchecked'></span>" + title);
          // .on((L.Browser.mobile ? "click" : "mouseover"), function (d) {
          //   d3.event.stopPropagation();

          //   self.censusDropdownList.selectAll(".serviceType").classed("open", false);
          //   d3.select(this).node().parentNode.classList.toggle("open");
          // });

        btnGroup.append("button").classed("btn btn-item btn-dropdown col-md-2",true)
          .html("<span class='caret'></span>")
          .on("mouseover", function (d) {
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if(!d3.select(this).classed("disabled")){
              self.censusDropdownList.selectAll(".serviceType").each(function(d){
                let curGroup = d3.select(this).select(".btn-group");
                curGroup.selectAll(".dropdown-menu").classed("hidden", !curGroup.classed("open"));
              });
            }
          }).on("click",function(d){
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (d3.select(this).classed("disabled")) {
              return;
            }

            let parent = btnGroup;
            let parentState = parent.classed("open");

            self.censusDropdownList.selectAll(".serviceType").selectAll(".btn-group").classed("open", false)
              .selectAll(".dropdown-menu").classed("hidden",true);
            parent.classed("open", !parentState);
            parent.selectAll(".dropdown-menu").classed("hidden",!parent.classed("open"));
          }).classed("disabled", categories[c1].length < 2);

        //set total button; data should be at zero index
        totalBtn.datum({
          mainType: c1,
          subType: categories[c1][0],
          type: "census"
        }).on("click", function(d){
            console.log(d);
            // set other filters to allow for only one sub category selection at a time
            let isMainCategorySelection = Object.keys(self.filters).length > 1;
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== d.mainType) {
                self.mainCategoryStates[mainCategory] = "none";
              }
            }
            let filterKey = getFilterKey(d.mainType, d.subType);

            self.censusDropdownList.selectAll(".glyphicon")
              .attr("class", "glyphicon glyphicon-unchecked");
            listItem.select("ul").selectAll(".serviceSubtype") 
              .each(function (subType) {
                let curKey = getFilterKey(d.mainType, subType);

                //check all sub groups
                self.filters[curKey] = true;
                updateSubCategoryIcon(d.mainType, subType);
              });
            let curSelection = self.filters[filterKey];
            self.filters = {};

            //select current subcategory if previous filters indicate a main category selection
            if (isMainCategorySelection) {
              self.filters[filterKey] = true;
            } else {
              // toggle whether or not it is selected
              self.filters[filterKey] = !curSelection;
            }

            if (self.filters[filterKey]) {
              var button = d3.select("#censusDropdownButton");

              button.selectAll('#currentServiceSelection').text(`Total: ${_.truncate(_.capitalize(title),{length: 30})}`);
              button.attr("class", "btn btn-success navbar-btn dropdown-toggle");

              document.getElementById("allCensusButton").style.display = "";

              addMap(d);
            } else {
              resetFilters();
            }


            updateSubCategoryIcon(d.mainType, d.subType);
            updateMainCategoryOnSubUpdate(d.mainType);

            chartButtonClick(d);

          });

        // create tab content div for this t1 category
        let secondaryDropdown = btnGroup.append("ul")
          .attr("class", "dropdown-menu");


        secondaryDropdown.selectAll(".secondaryCategory")
          .data(categories[c1].slice(1))
          .enter().append("li")
          .attr("class", "secondaryCategory serviceSubtype")
          .append("a")
          .datum(function (c2) {
            let property_data = {
              mainType: c1,
              subType: c2,
              type: "census"
            };

            if (property_data.subType.indexOf("Total") !== 0) {
              property_data.title = property_data.subType;
            }
            return property_data;
          }).attr("id", d => "sub_" + convertPropertyToID(d.subType))
          .html(function (d) {
            return "<span class='glyphicon glyphicon-unchecked'></span>" + d.subType;
          })
          .on("click", function (d) {
            //reset other filters to allow for only one sub category selection at a time
            let isMainCategorySelection = Object.keys(self.filters).length > 1;
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== d.mainType) {
                self.mainCategoryStates[mainCategory] = "none";
              }
            }
            let filterKey = getFilterKey(d.mainType,d.subType);

            self.censusDropdownList.selectAll(".glyphicon")
              .attr("class", "glyphicon glyphicon-unchecked");
            listItem.select("ul").selectAll(".serviceSubtype")
              .each(function (subType) {
                let curKey = getFilterKey(d.mainType,subType);
                if (curKey !== filterKey) {
                  self.filters[curKey] = false;

                  updateSubCategoryIcon(d.mainType, subType);
                }
              });
            let curSelection = self.filters[filterKey];
            self.filters = {};

            //select current subcategory if previous filters indicate a main category selection
            if (isMainCategorySelection) {
              self.filters[filterKey] = true;
            } else {
              // toggle whether or not it is selected
              self.filters[filterKey] = !curSelection;
            }

            if (self.filters[filterKey]) {
              var button = d3.select("#censusDropdownButton");

              button.selectAll('#currentServiceSelection').text(`${_.truncate(d.subType, { length: 30 })}`);
              button.attr("class", "btn btn-success navbar-btn dropdown-toggle");

              document.getElementById("allCensusButton").style.display = "";

              addMap(d);
            } else {
              resetFilters();
            }


            updateSubCategoryIcon(d.mainType, d.subType);
            updateMainCategoryOnSubUpdate(d.mainType);

            chartButtonClick(d);
          });

      });

    if (max_height) {
      self.censusDropdownList.selectAll('.dropdown-submenu>.dropdown-menu') //set max height of sub-dropdowns
        .style('max-height', `${max_height}px`).style('overflow-y', 'scroll');
    }
  }

  function convertPropertyToID(propertyName) {
    return propertyName.replace(/\W+/g, '_')
  }

  function addMap(d) {
    console.log("Adding map",d);
    let reducedData, starGraph;
    const aggregatedMainTypes = ['Race of Householder', 'Household Size', 'Sex by Age'].map((m) => m.toLowerCase());
    if(d.type === "census" && d.subType.indexOf("Total") > -1 && aggregatedMainTypes.indexOf(d.mainType.toLowerCase().replace(/_/g,' ')) > -1){
      console.log("Found an aggregated type", d);
      // d.graph = {
      //   init: (parent) => {
      //     // console.log(parent.datum()); //array of features

      //     // initiialize starplotview graph
      //     // starGraph = new StarPlotView({
      //     //   parent,
      //     //   name: d.mainType
      //     // }); //
      //   },
      //   update: () => {}
      // }
      reducedData = App.models.censusData.getSubsetGeoJSON(d/*,true*/);
    }else{
      reducedData = App.models.censusData.getSubsetGeoJSON(d);
    }
    let index = 0;
    App.views.map.drawChoropleth(
      reducedData, 
      d.title || d.mainType.split('').map((d) => {
        return index++ === 0 ? d.toUpperCase() : d.toLowerCase()
      }).join('').replace(/_/g," "),
      {
        clickHandler: (layer) => {
          if(!d.graph) return;

          console.log(layer);
          console.log(App.models.censusData.getSubCategories(d.mainType));
        } //update bars on click
      }
    );
  }

  function removeMap() {
    App.views.map.drawChoropleth();
  }

  function chartButtonClick(d) {
    console.log("Create chart for", d);
    if(d.type !== "census"){
      App.views.chartList.addPropertyChart(d);
    }else{
      let title = d.title ? `<b>${d.subType}</b>` : undefined;
      App.views.chartList.addPropertyChart(d, title);
    }
  }

  function addChart(d) {

    let chartLabel = panelHeading.selectAll(".numCharts");
    let numCharts = +chartLabel.attr("data-count") + 1;

    chartLabel.attr("data-count", numCharts)
      .text(numCharts + (numCharts === 1 ? " Chart" : " Charts"))
      .style("display", numCharts <= 0 ? "none" : "inline");
  }

  function removeChart(d) {
    d3.select(this).attr("class", "btn btn-success chartButton");

    let panelHeading = d3.select(self.mapDataPanel.selectAll("#" + _.kebabCase("main_" + d.mainType)).node().parentNode).selectAll(".panel-heading");
    // update chart Number

    let chartLabel = panelHeading.selectAll(".numCharts");
    let numCharts = +chartLabel.attr("data-count") - 1;

    chartLabel.attr("data-count", numCharts)
      .text(numCharts + (numCharts === 1 ? " Chart" : " Charts"))
      .style("display", numCharts <= 0 ? "none" : "inline");
  }

  function removeChartFromList(propertyTypes) {
    d3.selectAll("#" + _.kebabCase("main_" + propertyTypes.mainType)).selectAll("#" + _.kebabCase("sub_" + propertyTypes.subType))
      .select(".chartButton")
      .each(removeChart);
  }

  function updateMainCategoryOnSubUpdate(category) {
    // console.log(self.data[category]);
    let subcategories = self.data[category];
    let hasChecked = false;
    let hasUnchecked = false;
    let isTotal = false;

    for (let subC of subcategories) {
      let filterKey = getFilterKey(category,subC);
      if (self.filters[filterKey]) {
        if (subC.toLowerCase().indexOf("total") > -1) {
          isTotal = true;
        }
        hasChecked = true;
      } else {
        hasUnchecked = true;
      }
    }

    console.log(self.filters);

    if (hasChecked && hasUnchecked && !isTotal) {
      self.mainCategoryStates[category] = "some";
    } else if (hasChecked || isTotal) {
      self.mainCategoryStates[category] = "all";
    } else {
      self.mainCategoryStates[category] = "none";
    }

    updateMainCategoryIcon(category);
  }

  function updateMainCategoryIcon(category) {
    let id = "#main_" + convertPropertyToID(category);

    let item = self.censusDropdownList.selectAll(".serviceType " + id);
    let selectAllButton = self.censusDropdownList.selectAll(".serviceSubtype " + id);
    let state = self.mainCategoryStates[category];

    item.select(".glyphicon")
      .attr("class", "glyphicon " + self.mainStateToIcon[state]);

    if (state === "some") {
      selectAllButton.select(".glyphicon")
        .attr("class", "glyphicon glyphicon-unchecked");
    } else {
      selectAllButton.select(".glyphicon")
        .attr("class", "glyphicon " + self.mainStateToIcon[state]);
    }
  }

  function updateSubCategoryIcon(mainCategory,subCategory) {
    let id = "#sub_" + convertPropertyToID(subCategory);
    let main_id = "#main_" + convertPropertyToID(mainCategory);

    let item = d3.select(self.censusDropdownList.selectAll(main_id).node().parentNode).selectAll(id);
    let state = self.filters[getFilterKey(mainCategory,subCategory)];

    // console.log(...arguments,main_id,id,state);

    item.select(".glyphicon")
      .attr("class", "glyphicon " + (state ? "glyphicon-check" : "glyphicon-unchecked"));
  }


  return {
    setupDataPanel,
    attachResetOverlayButton,
    resetFilters,
    populateDropdown,
    removeChartFromList,
    setCensusClearButton
  };
}