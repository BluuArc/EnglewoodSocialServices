/* global d3 */
'use strict';

// eslint-disable-next-line no-unused-vars
const SelectionAreaView = function(selectionAreaId = '') {
  const self = {
    selectionArea: null,
    mainCategories: {}
  };

  init();
  function init() {
    self.selectionArea = d3.select(selectionAreaId);
  }

  function noop() {}

  function addMainCategory(name = '', id = '', onClick = noop) {
    if (hasMainCategoryId(id)) {
      throw Error(`Main Category ${id} already exists`);
    }
    const mainSelection = self.selectionArea.append('div')
      .attr('id', id).classed('selection-area--main-category', true);
    mainSelection.append('button')
      .attr('id', 'main-header').html(name)
      .classed('btn btn-block', true)
      .on('click', onClick);
    mainSelection.append('div').attr('id', 'subcategory-list')
      .classed('btn-group-vertical', true);
    self.mainCategories[id] = {
      selection: mainSelection,
      name,
      subCategories: {},
    };
    // return d3 selection to main category item
    return self.mainCategories[id].selection;
  }

  function addSubCategory(mainId = '', name = '', id = '', onClick = noop) {
    if (hasSubCategoryId(mainId, id)) {
      throw Error(`${mainId}/${id} already exists`);
    }

    const mainCategoryEntry = getMainCategory(mainId);
    const mainSelection = mainCategoryEntry.selection;
    const subCategorySelection = mainSelection.select('#subcategory-list')
      .append('button').attr('id', id)
      .classed('selection-area--sub-category', true)
      .html(name).on('click', onClick);

    mainCategoryEntry.subCategories[id] = {
      selection: subCategorySelection,
      name,
    };

    // return d3 selection to sub category item
    return mainCategoryEntry.subCategories[id].selection;
  }

  function deleteMainCategory(id = '') {
    if (!hasMainCategoryId(id)) {
      throw Error(`Main Category ${id} does not exist`);
    }
    const mainEntry = getMainCategory(id);
    Object.keys(mainEntry.subCategories)
      .forEach(subId => { deleteSubCategory(id, subId); });
    mainEntry.selection.remove();
    delete self.mainCategories[id];
  }

  function deleteSubCategory(mainId = '', subId = '') {
    if (!hasSubCategoryId(mainId, subId)) {
      throw Error(`${mainId}/${subId} does not exist`);
    }
    const subEntry = getSubCategory(mainId, subId);
    subEntry.selection.remove();
    delete getMainCategory(mainId).subCategories[subId];
  }

  function hasMainCategoryId(id) {
    return !!getMainCategory(id);
  }

  function hasSubCategoryId(mainId, subId) {
    return !!getSubCategory(mainId, subId);
  }

  function getMainCategory(id = '') {
    return self.mainCategories[id];
  }

  function getSubCategory(mainId = '', subId = '') {
    if (!hasMainCategoryId(mainId)) {
      throw Error(`Main Category ${mainId} does not exist`);
    }
    return getMainCategory(mainId).subCategories[subId];
  }


  return {
    hasMainCategoryId,
    hasSubCategoryId,
    getMainCategory,
    getSubCategory,
    addMainCategory,
    deleteMainCategory,
    addSubCategory,
    deleteSubCategory
  };
};
