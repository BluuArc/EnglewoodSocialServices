/* global d3 */
// eslint-disable-next-line no-unused-vars
class MultiDropdownView {
  constructor (options = {}) {
    const getElem = (selector) => document.querySelector(selector);

    this._buttonGroup =  options.buttonGroup ? getElem(options.buttonGroup) : null;
    this._selectButton = options.selectButton ? getElem(options.selectButton) : null;
    this._dropdownMenu = options.dropdownMenu ? getElem(options.dropdownMenu) : null;
    this._clearBtn = options.clearButton ? getElem(options.clearButton) : null;
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
