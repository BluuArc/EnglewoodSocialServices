/* global d3 */
// eslint-disable-next-line no-unused-vars
class MultiDropdownView {
  constructor ({ buttonGroup, selectButton, dropdownMenu, clearButton }) {
    const getElem = (selector) => document.querySelector(selector);

    this._buttonGroup = getElem(buttonGroup);
    this._selectButton = getElem(selectButton);
    this._dropdownMenu = getElem(dropdownMenu);
    this._clearBtn = getElem(clearButton);
  }

  _hasClickHandler(clickHandlers, name) {
    return typeof clickHandlers === 'object' && typeof clickHandlers[name] === 'function';
  }

  init () {
    throw new Error('Need to implement in subclass');
  }

  _onMainCategoryClick (clickHandlers, mainCategory, stopPropagation = false) {
    if (stopPropagation) {
      d3.event.stopPropagation(); // prevent menu close on link click
    }
    if (this._hasClickHandler(clickHandlers, 'onMainCategoryClick')) {
      clickHandlers.onMainCategoryClick(mainCategory);
    } else {
      console.debug('clicked main category button for', mainCategory);
    }
  }

  _onSideMenuClick () {
    // expanding side menu is dependent on how dropdown is initialized
    throw new Error('Need to implement in subclass');
  }

  _onSubCategoryClick (clickHandlers, mainCategory, subCategory, stopPropagation = false) {
    if (stopPropagation) {
      d3.event.stopPropagation(); // prevent menu close on link click
    }
    if (this._hasClickHandler(clickHandlers, 'onSubCategoryClick')) {
      clickHandlers.onSubCategoryClick(mainCategory, subCategory);
    } else {
      console.debug('clicked sub category', arguments);
    }
  }

  updateView () {
    throw new Error('Need to implement in subclass');
  }
}
