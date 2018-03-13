"use strict";

var App = App || {};

let SearchController = function() {
  let self = {
    input: null,
    counter: null,
    button: null,

    lastSearchedTerm: null
  };

  function attachDOMElements(inputID, counterID, buttonID) {
    self.input = d3.selectAll(inputID)
      .on("input", onInput)
      .on("keyup", function() {
        if (d3.event.keyCode == 13) {
          // hitting enter in the input is equivalent to pressing search button
          onButtonClick();
        }
      });

    self.counter = d3.selectAll(counterID);

    self.button = d3.selectAll(buttonID)
      .on("click", onButtonClick);
  }

  function setCount(count) {
    self.counter.html(count);
  }

  function onInput(d) {
    let searchTerm = self.input.node().value;

    let searchData = App.models.serviceData.getSearchedData(searchTerm);

    countChanged(searchData);

    if (self.lastSearchedTerm !== _.lowerCase(searchTerm)) {
      self.button.attr("class", "btn btn-success")
        .attr("disabled", null);
    } else {
      self.button.attr("class", "btn btn-default")
        .attr("disabled", true);
    }
  }

  function countChanged(data) {
    self.counter.html(data.length);

    if (data.length === 0) {
      self.counter.classed("searchCountEmpty", true);
    } else {
      self.counter.classed("searchCountEmpty", false);
    }
  }

  function onButtonClick(d) {
    let searchTerm = _.lowerCase(self.input.node().value);
    // has to do with state of list

    if (searchTerm !== self.lastSearchedTerm) {

      self.lastSearchedTerm = searchTerm;

      // update service list with search string

      let searchData = App.models.serviceData.getSearchedData(searchTerm);

      App.views.map.updateServicesWithFilter(searchData);
      App.views.serviceList.populateList(searchData);

      self.button.attr("class", "btn btn-default")
        .attr("disabled", true);
    }
  }

  function updateCounter() {

  }

  return {
    attachDOMElements,

    setCount,
    countChanged
  };
};
