"use strict";

var App = App || {};

let FilterDropdownController = function() {
  let self = {
    filterDropdownList: null,
    filterDropdownButton: null,
    allServicesButton: null,

    filters: {}, // equivalent to subcategory states

    mainCategoryStates: {},
    mainStateToIcon: {
      "none": "glyphicon-unchecked",
      "some": "glyphicon-plus",
      "all": "glyphicon-check"
    }
  };

  init();

  function init() {}

  function attachAllServicesButton(id) {
    self.allServicesButton = d3.selectAll(id)
      .on('click', resetFilters)
  }

  function resetFilters() {
    console.debug("Reset Filters");

    self.filters = {};

    for (let mainCategory of Object.keys(self.mainCategoryStates)) {
      self.mainCategoryStates[mainCategory] = "none";
    }

    self.filterDropdownList.selectAll(".glyphicon")
      .attr("class", "glyphicon glyphicon-unchecked");

    self.filterDropdownButton.selectAll('#currentServiceSelection').text("Select Services...");
    self.filterDropdownButton.attr("class", "btn btn-default dropdown-toggle");

    // self.allServicesButton.selectAll('#currentServiceSelection').text("Clear Selection");
    // self.allServicesButton.attr('disabled',true);

    filtersUpdated();
  }

  function setFilterDropdown(listID, buttonID) {
    self.filterDropdownList = d3.selectAll(listID);
    self.filterDropdownButton = d3.selectAll(buttonID);
  }

  function populateDropdown(max_height) {
    let tier1Categories = App.models.serviceTaxonomy.getTier1Categories();

    for (let category of tier1Categories) {
      self.mainCategoryStates[category] = "none"; // "some", "all"
    }

    self.filterDropdownList.selectAll(".mainType")
      .data(tier1Categories)
      .enter().append("li")
      .attr("class", "dropdown-submenu serviceType")
      .each(function(c1) {
        let listItem = d3.select(this);
        let tier2Categories = App.models.serviceTaxonomy.getTier2CategoriesOf(c1)
          .map(c2 => ({ mainType: c1, subType: c2 }));

        // create link within tab
        listItem.append("a")
          .attr("tabindex", -1)
          .attr("id", "main_" + convertPropertyToID(c1))
          .html("<span class='glyphicon glyphicon-unchecked'></span>" + c1)
          // .html(c1)
            .on((L.Browser.mobile ? "click" : "mouseover"), function(d) {
              d3.event.stopPropagation();

              self.filterDropdownList.selectAll(".serviceType").classed("open", false);
              d3.select(this).node().parentNode.classList.toggle("open");
            });


        // create tab content div for this t1 category
        let secondaryDropdown = listItem.append("ul")
          .attr("class", "dropdown-menu");

        secondaryDropdown.append("li")
          .attr("class", "serviceSubtype")
          .append("a")
          .datum(c1)
          .attr("id", "main_" + convertPropertyToID(c1))
          .html("<span class='glyphicon glyphicon-unchecked'></span>Select All")
          .on("click", function(c1) {
            // d3.event.stopPropagation(); // prevent menu close on link click
            self.filterDropdownList.selectAll(".serviceType").classed("open", false);

            //reset other filters to allow for only one main category selection at a time
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== c1) {
                self.mainCategoryStates[mainCategory] = "none";
              }
            }
            self.filterDropdownList.selectAll(".glyphicon")
              .attr("class", "glyphicon glyphicon-unchecked");
            self.filters = {};


            //update UI for main category selection
            let selected;
            if (self.mainCategoryStates[c1] === "all") {
              self.mainCategoryStates[c1] = "none";
              selected = false;
            } else {
              self.mainCategoryStates[c1] = "all";
              selected = true;
            }

            if (selected) {
              self.filterDropdownButton.selectAll('#currentServiceSelection').text(`${c1}`);
              self.filterDropdownButton.attr("class", "btn btn-success dropdown-toggle");

              self.allServicesButton.attr('disabled', null);
            } else {
              resetFilters();
            }

            updateMainCategoryIcon(c1);

            listItem.select("ul").selectAll(".serviceSubtype")
              .each(function(d) {
                let subType = d;
                if (typeof d === 'object') {
                  subType = d.subType;
                }
                // self.filters[d] = selected;
                setFilter(c1, subType, selected);

                updateSubCategoryIcon(subType);
              });

            filtersUpdated();
          });

        secondaryDropdown.append("li").attr("class", "divider");

        secondaryDropdown.selectAll(".secondaryCategory")
          .data(tier2Categories)
          .enter().append("li")
          .attr("class", "secondaryCategory serviceSubtype")
          .append("a")
          // .datum(c2)
          .attr("id", d => "sub_" + convertPropertyToID(d.subType))
          .html(function(d) {
            return "<span class='glyphicon glyphicon-unchecked'></span>" + d.subType;
          })
          .on("click", function(d) {
            // d3.event.stopPropagation(); // prevent menu close on link click

            //reset other filters to allow for only one sub category selection at a time
            let isMainCategorySelection = Object.keys(self.filters).length > 1;
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== d.mainType) {
                self.mainCategoryStates[mainCategory] = "none";
              }
            }
            self.filterDropdownList.selectAll(".glyphicon")
              .attr("class", "glyphicon glyphicon-unchecked");
            listItem.select("ul").selectAll(".serviceSubtype")
              .each(function(subType) {
                console.debug(subType);
                if (typeof subType === 'object') {
                  subType = subType.subType;
                }
                if (subType !== d.subType) {
                  // self.filters[subType] = false;
                  setFilter(d.mainType, subType, false);

                  updateSubCategoryIcon(subType);
                }
              });
            let curSelection = getFilter(d.mainType, d.subType);
            self.filters = {};

            //select current subcategory if previous filters indicate a main category selection
            if (isMainCategorySelection) {
              // self.filters[d.subType] = true;
              setFilter(d.mainType, d.subType, true);
            } else {
              // toggle whether or not it is selected
              // self.filters[d.subType] = !curSelection;
              setFilter(d.mainType, d.subType, !curSelection);
            }

            if (getFilter(d.mainType, d.subType)) {
              // self.allServicesButton.selectAll('#currentServiceSelection').text(`${_.truncate(d.subType,{length: 20})}`);
              self.filterDropdownButton.selectAll('#currentServiceSelection').text(`${_.truncate(d.subType,{length: 30})}`);
              self.filterDropdownButton.attr("class", "btn btn-success dropdown-toggle");

              self.allServicesButton.attr('disabled', null);
            } else {
              resetFilters();
            }


            updateSubCategoryIcon(d.subType);
            updateMainCategoryOnSubUpdate(d.mainType);

            filtersUpdated();
          });

      });

    if(max_height){
      self.filterDropdownList.selectAll('.dropdown-submenu>.dropdown-menu') //set max height of sub-dropdowns
        .style('max-height', `${max_height}px`).style('overflow-y', 'scroll');
    }
  }

  function convertPropertyToID(propertyName) {
    return propertyName.replace(/\W+/g, '_')
  }

  function updateMainCategoryOnSubUpdate(category) {
    let subcategories = App.models.serviceTaxonomy.getTier2CategoriesOf(category);
    let hasChecked = false;
    let hasUnchecked = false;

    for (let subC of subcategories) {
      if (self.filters[subC]) {
        hasChecked = true;
      } else {
        hasUnchecked = true;
      }
    }

    if (hasChecked && hasUnchecked) {
      self.mainCategoryStates[category] = "some";
    } else if (hasChecked) {
      self.mainCategoryStates[category] = "all";
    } else {
      self.mainCategoryStates[category] = "none";
    }

    updateMainCategoryIcon(category);
  }

  function updateMainCategoryIcon(category) {
    let id = "#main_" + convertPropertyToID(category);

    let item = self.filterDropdownList.selectAll(".serviceType>" + id);
    let selectAllButton = self.filterDropdownList.selectAll(".serviceSubtype>" + id);
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

  function updateSubCategoryIcon(category) {
    let id = "#sub_" + convertPropertyToID(category);

    let item = self.filterDropdownList.selectAll(id);
    let state = self.filters[category];

    item.select(".glyphicon")
      .attr("class", "glyphicon " + (state ? "glyphicon-check" : "glyphicon-unchecked"));
  }

  function filtersUpdated() {
    let filtersToSend = {};

    // for (let subcategory of Object.keys(self.filters)) {
    //   if (self.filters[subcategory]) {
    //     filtersToSend[subcategory] = true;
    //   }
    // }
    Object.keys(self.filters)
      .filter(key => self.filters[key])
      .forEach(filter => {
        filtersToSend[filter] = self.filters[filter];
      });

    let filteredData = App.models.serviceData.getFilteredData(filtersToSend);

    App.views.map.updateServicesWithFilter(filteredData);
    App.views.serviceList.populateList(filteredData);

    App.controllers.search.countChanged(filteredData);
    App.controllers.modal.countChanged(filteredData);

    App.controllers.modal.changeButtonState();
  }

  function createFilterID(mainCategory, subCategory = "*") {
    return `${App.models.serviceTaxonomy.getCategoryCodeOf(mainCategory)}||${subCategory.replace(/"/g, ' ').trim()}`;
  }

  function getFilter(main, sub) {
    return self.filters[createFilterID(main, sub)];
  }

  function setFilter(main, sub, value) {
    self.filters[createFilterID(main, sub)] = value;
  }

  return {
    setFilterDropdown,
    attachAllServicesButton,

    populateDropdown,
    resetFilters
  };
};
