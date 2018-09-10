/* global L ServiceTaxonomyModel ServiceFilterDropdownView MapView SocialServiceModel MapIconModel */
// eslint-disable-next-line no-unused-vars
class ServiceFilterController {
  constructor ({
    dropdownView = new ServiceFilterDropdownView(),
    mapView = new MapView(),
    serviceModel = new SocialServiceModel(),
    mapIconModel = new MapIconModel(),
  }) {
    // key = tier1 name, value = array of sub-categories
    this._states = {};
    this._dropdownView = dropdownView;
    this._mapView = mapView;
    this._defaultValues = {};
    this._serviceModel = serviceModel;
    this._mapIconModel = mapIconModel;
    this._serviceTaxonomyModel = null;
  }

  get _iconStates () {
    return {
      none: 'glyphicon-unchecked',
      some: 'glyphicon-plus',
      all: 'glyphicon-check',
    };
  }

  get layerGroupName () {
    return 'serviceMarkers';
  }

  getIconState (type) {
    return this._iconStates[type];
  }

  init (serviceTaxonomyModel = new ServiceTaxonomyModel()) {
    const tier1Categories = serviceTaxonomyModel.allTier1Categories;
    this._serviceTaxonomyModel = serviceTaxonomyModel;

    tier1Categories.forEach(category => {
      const tier2Categories = serviceTaxonomyModel.getTier2CategoriesOf(category);
      this._states[category] = []; // default to none
      this._defaultValues[category] = tier2Categories.slice();
    });

    this._dropdownView.init(serviceTaxonomyModel, {
      onMainCategoryClick: (mainCategory) => { this.toggleMainCategory(mainCategory); },
      onSubCategoryClick: (mainCategory, subCategory) => { this.toggleSubCategory(mainCategory, subCategory); },
      onClearButtonClick: () => { this.reset(); },
    });

    this._mapView.addLayerGroup(this.layerGroupName);
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

  isMainCategoryEnabled (mainCategory) {
    return this.getEnabledSubCategories(mainCategory).length > 0;
  }

  isSubCategoryEnabled (mainCategory, subCategory) {
    return this.getEnabledSubCategories(mainCategory).includes(subCategory);
  }

  getMainCategoryState (mainCategory) {
    return (!this.isMainCategoryEnabled(mainCategory))
      ? 'none'
      : (this.getEnabledSubCategories(mainCategory).length === this._defaultValues[mainCategory].length)
        ? 'all'
        : 'some';
  }

  get hasAnyFilters () {
    return Object.keys(this._states).some(mainCategory => this.isMainCategoryEnabled(mainCategory));
  }

  getMainCategoryGlyphicon (mainCategory) {
    return this._iconStates[this.getMainCategoryState(mainCategory)];
  }

  toggleMainCategory (category, value) {
    if (value !== undefined) { // specific toggle value
      this.setMainCategoryValue(category, (value) ? this._defaultValues[category] : []);
    } else {
      this.setMainCategoryValue(category, (!this.isMainCategoryEnabled(category)) ? this._defaultValues[category] : []);
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

  get filteredData () {
    return this._serviceModel.getData(!this.hasAnyFilters ? undefined : (entry) => {
      return Object.keys(this._states).some(mainCategory => {
        const mainCategoryCode = this._serviceTaxonomyModel.getCategoryCodeOf(mainCategory);
        const generateKey = (subCategory) => `${mainCategoryCode}||${subCategory}`;
        const activeSubCategories = this.getEnabledSubCategories(mainCategory);

        return entry[generateKey('*')] || activeSubCategories.some(subCategory => entry[generateKey(subCategory)]);
      });
    });
  }

  _generateServicePopupHtml (service) {
    let addressLink = '';
    if (service.Address) {
      const address = [service.Address, service.City, service.State, service.Zip].join(', ');
      addressLink = `
      <strong>
        <a href="http://maps.google.com/?q=${address}" target="_blank">
          <span class="glyphicon glyphicon-share-alt"></span> ${address}
        </a>
      </strong>`;
    }

    const phoneNumberMarkup = service['Phone Number'].length > 0
      ? `<span class="glyphicon glyphicon-earphone"></span> ${service['Phone Number'].join ? service['Phone Number'].join(' or ') : service['Phone Number']}`
      : '';

    const webSiteMarkup = (service.Website && service.Website.toLowerCase().trim() !== 'no website')
      ? `<strong><a href="${service.Website}" target="_blank"><span class="glyphicon glyphicon-home"></span> ${service.Website}</a></strong>`
      : '';

    return [
      `<strong>${service['Organization Name']}</strong>`,
      `${service['Description of Services']}`,
      addressLink,
      phoneNumberMarkup,
      webSiteMarkup
    ].filter(val => !!val).join('<br>');
  }

  updateViews () {
    this._dropdownView.updateView(this);
    const filteredData = this.filteredData;
    console.debug(filteredData);

    const markerGenerator = (serviceEntry, layerGroup, map) => {
      const marker = L.marker(
        L.latLng(+serviceEntry.Latitude || 0, +serviceEntry.Longitude || 0),
        {
          icon: this._mapIconModel.getIconById('serviceMarker'),
          riseOnHover: true,
          data: serviceEntry,
        }
      ).bindPopup(
        this._generateServicePopupHtml(serviceEntry),
        { autoPan: false }
      ).on('click', () => {
        console.debug(serviceEntry);
        map.closePopup();
      }).on('mouseover', function () {
        marker.openPopup();
      }).on('mouseout', function () {
        if (!this.options.data.expanded) {
          map.closePopup();
        }
      });
      return marker;
    };

    this._mapView.updateLayerGroup(this.layerGroupName, { markerGenerator, data: filteredData });
  }
}
