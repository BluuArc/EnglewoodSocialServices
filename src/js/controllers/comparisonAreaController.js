/* global d3 SelectionAreaView */
'use strict';

// eslint-disable-next-line no-unused-vars
const ComparisonAreaController = function(selectionAreaViewId, graphAreaViewId) {
  const self = {
    mainEntries: {},
    graphAreaView: null,
    selectionAreaView: null,
    active: {
      main: '',
      sub: ''
    }
  };

  init();
  function init() {
    self.graphAreaView = d3.select(graphAreaViewId);
    self.selectionAreaView = new SelectionAreaView(selectionAreaViewId);
  }

  function noop() {}

  function collapseSubCategories(mainEntryId) {
    const mainEntry = getMainEntry(mainEntryId);
    const button = mainEntry.selectionArea.select('button#main-header');
    const buttonGroup = mainEntry.selectionArea.select('#subcategory-list');
    resetGraphArea();
    setActiveSubId();
    if (buttonGroup.classed('hidden')) {
      // show button group
      buttonGroup.classed('hidden', false);
      button.select('.glyphicon').style('transform', null);
    } else {
      // hide button group
      buttonGroup.classed('hidden', true);
      button.select('.glyphicon').style('transform', 'rotate(-90deg)');
    }
  }

  function addMainEntry(name = '', id = '', onClick = collapseSubCategories) {
    if (hasMainEntry(id)) {
      throw Error(`Main Entry ${id} already exists`);
    }
    const mainEntry = {
      selectionArea: self.selectionAreaView.addMainCategory(name, id, () => onClick(id, self.graphAreaView)),
      name,
      subEntries: {},
    };

    self.mainEntries[id] = mainEntry;
    return mainEntry;
  }

  function addSubEntry(mainId = '', name = '', id = '', onClick = noop) {
    if (hasSubEntry(mainId, id)) {
      throw Error(`${mainId}/${id} already exists`);
    }
    const subEntry = {
      selectionArea: self.selectionAreaView.addSubCategory(mainId, name, id, () => onClick(mainId, id, self.graphAreaView)),
      name
    };

    const mainEntry = getMainEntry(mainId);
    mainEntry.subEntries[id] = subEntry;
    return subEntry;
  }

  function deleteMainEntry(id) {
    if (!hasMainEntry(id)) {
      throw Error(`Main Entry ${id} does not exist`);
    }
    const mainEntry = getMainEntry(id);
    Object.keys(mainEntry.subEntries)
      .forEach(subId => { deleteSubEntry(id, subId); });
    delete self.mainEntries[id];
  }

  function deleteSubEntry(mainId, subId) {
    if (!hasSubEntry(mainId, subId)) {
      throw Error(`${mainId}/${subId} does not exist`);
    }
    // const subEntry = getSubEntry(mainId, subId);
    self.selectionAreaView.deleteSubEntry(mainId, subId);
    delete getMainEntry(mainId).subEntries[subId];
  }

  function hasMainEntry(id) {
    return !!getMainEntry(id);
  }

  function getMainEntry(id) {
    return self.mainEntries[id];
  }

  function hasSubEntry(mainId, subId) {
    return !!getSubEntry(mainId, subId);
  }

  function getSubEntry(mainId, subId) {
    if (!hasMainEntry(mainId)) {
      throw Error(`Main Entry ${mainId} does not exist`);
    }
    return getMainEntry(mainId).subEntries[subId];
  }

  function getGraphArea() {
    return self.graphAreaView;
  }

  function resetGraphArea() {
    const graphArea = self.graphAreaView;
    graphArea.selectAll('*').remove();
    graphArea.append('div')
      .append('svg').attr('height', 50).attr('width', 400)
      .attr('id', 'default-graph-area-text')
      .append('text')
      .text('Choose a subcategory on the left to see a graph');
  }

  function setActiveSubId(mainId = '', subId = '') {
    if (hasMainEntry(self.active.main) && hasSubEntry(self.active.main, self.active.sub)) {
      const prevActiveMain = getMainEntry(self.active.main);
      const prevActiveSub = getSubEntry(self.active.main, self.active.sub);
      prevActiveMain.selectionArea.classed('active-category', false);
      prevActiveSub.selectionArea.classed('active-sub-category', false);
    }
    self.active.main = mainId;
    self.active.sub = subId;
    if (hasMainEntry(self.active.main) && hasSubEntry(self.active.main, self.active.sub)) {
      const currActiveMain = getMainEntry(self.active.main);
      const currActiveSub = getSubEntry(self.active.main, self.active.sub);
      currActiveMain.selectionArea.classed('active-category', true);
      currActiveSub.selectionArea.classed('active-sub-category', true);
    }
  }

  return {
    addMainEntry,
    deleteMainEntry,
    hasMainEntry,
    getMainEntry,

    addSubEntry,
    deleteSubEntry,
    hasSubEntry,
    getSubEntry,
    setActiveSubId,

    getGraphArea,
    resetGraphArea
  };
};
