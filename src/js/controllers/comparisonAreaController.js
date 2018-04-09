/* global d3 SelectionAreaView */
'use strict';

// eslint-disable-next-line no-unused-vars
const ComparisonAreaController = function(selectionAreaViewId, graphAreaViewId) {
  const self = {
    mainEntries: {},
    graphAreaView: null,
    selectionAreaView: null,
  };

  init();
  function init() {
    self.graphAreaView = d3.select(graphAreaViewId);
    self.selectionAreaView = new SelectionAreaView(selectionAreaViewId);
  }

  function noop() {}

  function addMainEntry(name = '', id = '', onClick = noop) {
    if (hasMainEntry(id)) {
      throw Error(`Main Entry ${id} already exists`);
    }
    const mainEntry = {
      selectionArea: self.selectionAreaView.addMainCategory(name, id, () => onClick(self.graphAreaView)),
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
      selectionArea: self.selectionAreaView.addSubCategory(mainId, name, id, () => onClick(self.graphAreaView)),
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

  return {
    addMainEntry,
    deleteMainEntry,
    hasMainEntry,
    getMainEntry,

    addSubEntry,
    deleteSubEntry,
    hasSubEntry,
    getSubEntry,

    getGraphArea,
  };
};
