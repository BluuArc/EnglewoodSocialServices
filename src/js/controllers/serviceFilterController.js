"use strict";

var App = App || {};

let ServiceFilterController = function() {
  let self = {
    dropdownList: null,
    dropdownBtn: null,
    serviceResetBtn: null,

    filters: {},

    mainCategoryStates: {},
    iconStates: {
      none: "glyphicon-unchecked",
      some: "glyphicon-plus",
      all: "glyphicon-check"
    },
    debug: (...args) => console.debug("[ServiceFilterController]", ...args),
  };

  init();

  function init() {}

  function setFilterDropdown(listID, buttonID) {
    self.dropdownList = d3.selectAll(listID);
    self.dropdownBtn = d3.selectAll(buttonID);
  }

  function attachServiceResetBtn(id) {
    self.serviceResetBtn = d3.selectAll(id)
      .on('click', resetFilters);
  }

  function resetFilters() {
    // clear filters
    self.filters = {};

    for(let category in self.mainCategoryStates){
      self.mainCategoryStates[category] = "none";
    }

    self.dropdownList.selectAll(".glyphicon")
      .attr("class", "glyphicon glyphicon-unchecked");

    filtersUpdated();
  }

  function convertPropertyToID(propertyName) {
    return propertyName.replace(/\W+/g, '_')
  }

  function createFilterID(mainCategory, subCategory = "*") {
    return `${App.models.serviceTaxonomy.getCategoryCodeOf(mainCategory)}||${subCategory.replace(/"/g, ' ').trim()}`;
  }

  function getFilter(main, sub) {
    return self.filters[createFilterID(main,sub)];
  }

  function setFilter(main,sub,value) {
    self.filters[createFilterID(main, sub)] = value;
  }

  function populateDropdown(max_height) {
    let tier1Categories = App.models.serviceTaxonomy.getTier1Categories();
    
    for(const category of tier1Categories){
      self.mainCategoryStates[category] = "none";
    }

    self.dropdownList.selectAll(".mainType")
      .data(tier1Categories)
      .enter().append("li")
      .attr("class", "dropdown-submenu serviceType")
      .each(function(c1) {
        let listItem = d3.select(this);
        let tier2Categories = App.models.serviceTaxonomy.getTier2CategoriesOf(c1)
          .map(c2 => ({ mainType: c1, subType: c2 }));
        let btnGroup = listItem.append("div").classed("btn-group row", true);

        let totalBtn = btnGroup.append("button").classed("btn btn-item col-md-10", true)
          .attr("tabindex", -1)
          .attr("id", "main_" + convertPropertyToID(c1))
          .html("<span class='glyphicon glyphicon-unchecked'></span>" + c1);

        // side menu button
        btnGroup.append("button").classed("btn btn-item btn-dropdown col-md-2", true)
          .html("<span class='caret'></span>")
          .on('click', function() { onSideMenuClick(this,btnGroup); })
          .classed("disabled", tier2Categories.length < 1);

        totalBtn.datum(c1).on('click', c1 => { onMainCategoryClick(c1, listItem); });

        // create tab content div for this t1 category
        let secondaryDropdown = btnGroup.append("ul")
          .attr("class", "dropdown-menu");

        secondaryDropdown.selectAll(".secondaryCategory")
          .data(tier2Categories)
          .enter().append("li")
            .attr("class", "secondaryCategory serviceSubtype")
          .append("a")
            .attr("id", d => "sub_" + convertPropertyToID(d.subType))
            .html(function (d) {
              return "<span class='glyphicon glyphicon-unchecked'></span>" + d.subType;
            })
            .on('click', (...args) => { onSubcategoryClick(c1, listItem, ...args); });
      });
    
    if (max_height) {
      self.dropdownList.selectAll('.dropdown-submenu>.dropdown-menu') //set max height of sub-dropdowns
        .style('max-height', `${max_height}px`).style('overflow-y', 'scroll');
    }
  }

  function onSideMenuClick(elem, btnGroup) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    if (d3.select(elem).classed("disabled")) {
      return;
    }

    let parent = btnGroup;
    let parentState = parent.classed("open");

    self.dropdownList.selectAll(".serviceType").selectAll(".btn-group").classed("open", false)
      .selectAll(".dropdown-menu").classed("hidden", true);
    parent.classed("open", !parentState);
    parent.selectAll(".dropdown-menu").classed("hidden", !parent.classed("open"));
  }

  function onMainCategoryClick(c1, listItem) {
    self.debug("Clicked total button for", c1);
    d3.event.stopPropagation(); // prevent menu close on link click
    self.dropdownList.selectAll(".serviceType").classed("open", false);

    // update UI to only allow one main category filter
    // for (let mainCategory in self.mainCategoryStates) {
    //   if (mainCategory !== c1) {
    //     self.mainCategoryStates[mainCategory] = "none";
    //   }
    // }
    // self.dropdownList.selectAll(".glyphicon")
    //   .attr("class", "glyphicon glyphicon-unchecked");
    // self.filters = {};

    let hasSelection, isSelected;
    if (self.mainCategoryStates[c1] === "all") {
      self.mainCategoryStates[c1] = "none";
      isSelected = false;
    } else {
      self.mainCategoryStates[c1] = "all";
      isSelected = true;
    }

    if(Object.keys(self.mainCategoryStates).filter(d => self.mainCategoryStates[d] !== "none").length === 0){
      resetFilters();
    }

    updateMainCategoryIcon(c1);

    listItem.select("ul").selectAll(".serviceSubtype")
      .each(function (d) {
        setFilter(d.mainType, d.subType, isSelected);
      });

    self.dropdownList.selectAll(".serviceSubtype")
      .each(function (d) {
        updateSubCategoryIcon(d.subType, d.mainType);
      });

    App.controllers.serviceMarkerView.setVisibilityState(true); 
    filtersUpdated();
  }

  function updateMainCategoryIcon(category) {
    let id = "#main_" + convertPropertyToID(category);

    let item = self.dropdownList.selectAll(".serviceType " + id);
    let state = self.mainCategoryStates[category];

    item.select(".glyphicon")
      .attr("class", "glyphicon " + self.iconStates[state]);
  }

  function updateSubCategoryIcon(category, main) {
    let id = "#sub_" + convertPropertyToID(category);

    let item = self.dropdownList.selectAll(".serviceType #main_" + convertPropertyToID(main)).select(function () { return this.parentNode; }).select(id);

    let state = getFilter(main,category);

    item.select(".glyphicon")
      .attr("class", "glyphicon " + (state ? "glyphicon-check" : "glyphicon-unchecked"));
  }

  function onSubcategoryClick(c1, listItem, d, index, elementsArr) {
    d3.event.stopPropagation(); // prevent menu close on link click
    if (typeof d === "string") {
      d = {
        mainType: c1,
        subType: d3.select(elementsArr[index]).text()
      };
    }

    let isMainCategorySelection = getFilter(d.mainType);
    // for (let mainCategory of Object.keys(self.mainCategoryStates)) {
    //   if (mainCategory !== d.mainType) {
    //     self.mainCategoryStates[mainCategory] = "none";
    //   }
    // }
    // self.dropdownList.selectAll(".glyphicon")
    //   .attr("class", "glyphicon glyphicon-unchecked");

    // clear out any other subtype selections
    // self.dropdownList.selectAll(".serviceSubtype")
    //   .each(function (subData) {
    //     updateSubCategoryIcon(subData.subType, c1);
    //   });
    let curSelection = getFilter(d.mainType) || getFilter(d.mainType, d.subType);
    let hasOtherFilters = Object.keys(self.filters).map(d => self.filters[d]).filter(bool => bool).length > 1;

    //select current subcategory if previous filters indicate a main category selection
    setFilter(d.mainType, d.subType, isMainCategorySelection ? true : !curSelection);

    if(!hasOtherFilters && !getFilter(d.mainType,d.subType)) {
      resetFilters();
    }

    updateSubCategoryIcon(d.subType, d.mainType);

    self.dropdownList.selectAll(".serviceType")
      .each(function(d){
        self.debug(d);
        updateMainCategoryOnSubUpdate(d);
      });

    App.controllers.serviceMarkerView.setVisibilityState(true); 
    filtersUpdated();
  }

  function updateMainCategoryOnSubUpdate(category) {
    let subcategories = App.models.serviceTaxonomy.getTier2CategoriesOf(category);
    let hasChecked = false;
    let hasUnchecked = false;

    for (let subC of subcategories) {
      if (getFilter(category,subC)) {
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

  function getCurrentFilters() {
    let filtersToSend = {};
    console.debug({filters: self.filters});
    Object.keys(self.filters)
      .filter(key => self.filters[key])
      .forEach(filter => {
        filtersToSend[filter] = self.filters[filter];
      });
    return filtersToSend;
  }

  // update UI with new filters
  function filtersUpdated() {
    self.debug("Filters", self.filters);
    let activeFilters = Object.keys(self.filters).filter(d => self.filters[d]);
    let mainCategory = Object.keys(self.mainCategoryStates).filter(d => self.mainCategoryStates[d] === "all" || self.mainCategoryStates[d] === "some");
    if(activeFilters.length < 1){
      self.dropdownBtn.selectAll('#currentServiceSelection').text("Select Services...");
      self.dropdownBtn.selectAll('#service-dropdown-marker').style('color', null);
      self.dropdownBtn.attr("class", "btn btn-default dropdown-toggle navbar-btn rounded");
      self.serviceResetBtn.style('display', 'none');
    }else {
      let button = self.dropdownBtn.selectAll('#currentServiceSelection');
      if (mainCategory.length === 1 && mainCategory.filter(d => self.mainCategoryStates[d] === "all").length === 1) {
        button.text(mainCategory[0]);
      }else{
        if(activeFilters.length === 1){
          let filterName = activeFilters[0].indexOf("||") > -1 ? activeFilters[0].split("||")[1] : activeFilters[0];
          button.text(_.truncate(filterName, { length: 30 }));
        }else{
          button.text("Various Services");
        }
        if(mainCategory.length > 1){
          self.debug("main categories", mainCategory);
        }
      }
      self.dropdownBtn.selectAll('#service-dropdown-marker').style('color', 'white');
      self.dropdownBtn.attr("class", "btn btn-success dropdown-toggle navbar-btn");
      self.serviceResetBtn.style('display', null);
    }

    let filtersToSend = getCurrentFilters();

    let dataSubset = App.models.serviceData.getFilteredData(filtersToSend);

    App.views.map.updateServicesWithFilter(dataSubset);

    //show/hide buttons based on previous configuration
    let visibilityState = App.controllers.serviceMarkerView.markersAreVisible();
    App.controllers.serviceMarkerView.setVisibilityState(visibilityState);
  }

  return {
    setFilterDropdown,
    attachServiceResetBtn,
    resetFilters,
    populateDropdown
  }
};
