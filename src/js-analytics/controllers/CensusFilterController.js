/* global L CensusDataModel ServiceFilterDropdownView MapView */
// eslint-disable-next-line no-unused-vars
class CensusFilterController {
  constructor ({
    dropdownView = new ServiceFilterDropdownView(),
    mapView = new MapView(),
    censusModel = new CensusDataModel(),
  }) {
    // key = tier1 name, value = array of sub-categories
    this._states = {};

    this._dropdownView = dropdownView;
    this._mapView = mapView;
    this._activeFilter = {
      mainType: null,
      subType: null
    };
    this._censusModel = censusModel;
    this._markerViewController = null;
  }

  get _iconStates () {
    return {
      none: 'glyphicon-unchecked',
      some: 'glyphicon-plus',
      all: 'glyphicon-check',
    };
  }

  static get layerGroupName () {
    return 'censusChloropleth';
  }

  get totalKey () {
    return 'Total';
  }

  getIconState (type) {
    return this._iconStates[type];
  }

  init () {
    this._mapView.addLayerGroup(CensusFilterController.layerGroupName);

    this._dropdownView.init(this._censusModel, {
      onMainCategoryClick: (mainCategory) => { this.toggleMainCategory(mainCategory); },
      onSubCategoryClick: (mainCategory, subCategory) => { this.toggleSubCategory(mainCategory, subCategory); },
      onClearButtonClick: () => { this.reset(); },
    });
  }

  reset () {
    this._activeFilter = {
      mainType: null,
      subType: null
    };
    this.updateViews();
  }

  isMainCategoryEnabled (mainCategory) {
    return this._activeFilter.mainType === mainCategory;
  }

  isSubCategoryEnabled (mainCategory, subCategory) {
    return this.isMainCategoryEnabled(mainCategory) && this._activeFilter.subType === subCategory;
  }

  getMainCategoryState (mainCategory) {
    return (!this.isMainCategoryEnabled(mainCategory))
      ? 'none'
      : (this.isSubCategoryEnabled(mainCategory, this.totalKey))
        ? 'all'
        : 'some';
  }

  getMainCategoryGlyphicon (mainCategory) {
    return this._iconStates[this.getMainCategoryState(mainCategory)];
  }

  toggleMainCategory (category, value) {
    if (value !== undefined) { // specific toggle value
      if (value) {
        this.setActiveFilter(category, this.totalKey);
      } else {
        this.reset();
      }
    } else {
      if (this.isMainCategoryEnabled(category)) {
        this.reset();
      } else {
        this.setActiveFilter(category, this.totalKey);
      }
    }
  }

  toggleSubCategory (mainCategory, subCategory, value) {
    if (value !== undefined) { //specific toggle value
      if (value) {
        this.setActiveFilter(mainCategory, subCategory);
      } else {
        this.reset();
      }
    } else {
      if (this.isSubCategoryEnabled(mainCategory, subCategory)) {
        this.reset();
      } else {
        this.setActiveFilter(mainCategory, subCategory);
      }
    }
  }

  setActiveFilter (mainType, subType) {
    console.debug('setting new active filter', mainType, subType);
    this._activeFilter.mainType = mainType;
    this._activeFilter.subType = subType;
    this.updateViews();
  }

  get activeFilter () {
    return {
      mainType: this._activeFilter.mainType,
      subType: this._activeFilter.subType,
    };
  }

  updateViews () {
    this._dropdownView.updateView(this);
  }
}
