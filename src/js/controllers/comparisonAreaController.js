'use strict';

// eslint-disable-next-line no-unused-vars
const ComparisonAreaController = function(selectionAreaView/*, graphAreaView*/) {
  const self = {
    mainEntries: {}
  };

  init();
  function init() {}

  function addMainEntry(name = '', id = '', onClick) {
    if (hasMainEntry(id)) {
      throw Error(`Main Entry ${id} already exists`);
    }
    const mainEntry = {
      selectionArea: selectionAreaView.addMainCategory(name, id, onClick),
      name,
      subEntries: {},
    };

    self.mainEntries[id] = mainEntry;
    return mainEntry;
  }

  function addSubEntry(mainId = '', name = '', id = '', onClick) {
    if (hasSubEntry(mainId, id)) {
      throw Error(`${mainId}/${id} already exists`);
    }
    const subEntry = {
      selectionArea: selectionAreaView.addSubCategory(mainId, name, id, onClick),
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
    selectionAreaView.deleteSubEntry(mainId, subId);
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

  return {
    addMainEntry,
    deleteMainEntry,
    hasMainEntry,
    getMainEntry,

    addSubEntry,
    deleteSubEntry,
    hasSubEntry,
    getSubEntry
  };
};
