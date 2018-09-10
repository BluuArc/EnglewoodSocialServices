/* global ServiceTaxonomyModel ServiceFilterDropdownView MapView */
// eslint-disable-next-line no-unused-vars
class ServiceFilterController {
  constructor ({ dropdownView = new ServiceFilterDropdownView(), mapView = new MapView()}) {
    // key = tier1 name, value = array of sub-categories
    this._states = {};
    this._dropdownView = dropdownView;
    this._mapView = mapView;
    this._defaultValues = {};
  }

  get _iconStates () {
    return {
      none: 'glyphicon-unchecked',
      some: 'glyphicon-plus',
      all: 'glyphicon-check',
    };
  }

  getIconState (type) {
    return this._iconStates[type];
  }

  init (serviceTaxonomyModel = new ServiceTaxonomyModel()) {
    const tier1Categories = serviceTaxonomyModel.allTier1Categories;

    tier1Categories.forEach(category => {
      const tier2Categories = serviceTaxonomyModel.getTier2CategoriesOf(category);
      this._states[category] = []; // default to none
      this._defaultValues[category] = tier2Categories.slice();
    });

    this._dropdownView.init(serviceTaxonomyModel, {
      onMainCategoryClick: (mainCategory) => { this.toggleMainCategory(mainCategory); },
      onSubCategoryClick: (mainCategory, subCategory) => { this.toggleSubCategory(mainCategory, subCategory); },
    });
  }

  getEnabledSubCategories(mainCategory) {
    console.assert(this._states[mainCategory] !== undefined, 'no entry found for', mainCategory);
    return this._states[mainCategory];
  }

  reset () {
    Object.keys(this._states).forEach(mainCategory => {
      this._states[mainCategory] = [];
    });
    this.updateViews();
  }

  isSubCategoryEnabled (mainCategory, subCategory) {
    return this.getEnabledSubCategories(mainCategory).includes(subCategory);
  }

  getMainCategoryGlyphicon (mainCategory) {
    const categoryList = this.getEnabledSubCategories(mainCategory);
    const iconStates = this._iconStates;
    return (categoryList.length === 0)
      ? iconStates.none
      : (categoryList.length === this._defaultValues[mainCategory].length)
        ? iconStates.all
        : iconStates.some;
  }

  toggleMainCategory (category, value) {
    if (value !== undefined) { // specific toggle value
      this.setMainCategoryValue(category, (value) ? this._defaultValues[category] : []);
    } else {
      this.setMainCategoryValue(category, (this.getEnabledSubCategories(category).length === 0) ? this._defaultValues[category] : []);
    }
  }

  setMainCategoryValue (category, value) {
    console.debug('setting category state', category, value);
    this._states[category] = value;
    this.updateViews();
  }

  toggleSubCategory (mainCategory, subCategory, value) {
    let categoryList = this.getEnabledSubCategories(mainCategory).slice();
    if (value !== undefined) { // specific toggle value
      if (value && !categoryList.includes(subCategory)) {
        categoryList.push(subCategory);
      } else if (!value && categoryList.includes(subCategory)) {
        categoryList = categoryList.filter(val => val !== subCategory);
      }
    } else {
      if (!categoryList.includes(subCategory)) {
        categoryList.push(subCategory);
      } else if (categoryList.includes(subCategory)) {
        categoryList = categoryList.filter(val => val !== subCategory);
      }
    }
    this.setMainCategoryValue(mainCategory, categoryList);
  }

  get state () {
    return this._states;
  }

  updateViews () {
    this._dropdownView.updateView(this);
  }
}
