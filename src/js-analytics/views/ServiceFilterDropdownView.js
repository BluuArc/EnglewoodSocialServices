/* global d3 MultiDropdownView ServiceTaxonomyModel ServiceFilterController */
// eslint-disable-next-line no-unused-vars
class ServiceFilterDropdownView extends MultiDropdownView {
  constructor(config = {}) {
    const defaultConfig = {
      buttonGroup: '#service-button-group',
      // selectButton: '#service-button-group button.select-btn',
      dropdownMenu: '#service-button-group ul.dropdown-menu',
      // clearButton: '#service-button-group button.clear-btn',
    };

    const getValue = (field) => config[field] || defaultConfig[field];
    super({
      buttonGroup: getValue('buttonGroup'),
      // selectButton: getValue('selectButton'),
      dropdownMenu: getValue('dropdownMenu'),
      // clearButton: getValue('clearButton'),
    });

    this._nameMapping = {};
  }

  init(serviceTaxonomyModel = new ServiceTaxonomyModel(), clickHandlers = {}) {
    const tier1Categories = serviceTaxonomyModel.allTier1Categories;

    const dropdown = d3.select(this._dropdownMenu);
    const self = this;

    dropdown.selectAll('.service-main-type')
      .data(tier1Categories)
      .enter().append('li')
      .attr('class', 'dropdown-submenu service-main-type')
      .each(function (c1) {
        // need to pass in self as 'this' reference changes
        self._addListItem(this, c1, serviceTaxonomyModel, self, clickHandlers);
      });

    
    // if (this._hasClickHandler(clickHandlers, 'onClearButtonClick'))  {
    //   d3.select(this._clearBtn).on('click', clickHandlers.onClearButtonClick);
    // }
  }

  _addListItem(elem, tier1Category, serviceTaxonomyModel = new ServiceTaxonomyModel(), self, clickHandlers) {
    const tier2Categories = serviceTaxonomyModel.getTier2CategoriesOf(tier1Category);

    const btnGroup = d3.select(elem).append('div').classed('btn-group row', true);

    const selectAllBtn = btnGroup.append('button').classed('btn btn-item col-md-10', true)
      .attr('tabindex', -1)
      .html('<span class=\'glyphicon glyphicon-unchecked\'></span>' + tier1Category)
      .on('click', () => self._onMainCategoryClick(clickHandlers, tier1Category, true));

    // side menu button
    btnGroup.append('button').classed('btn btn-item btn-dropdown col-md-2', true)
      .html('<i class="caret"></i>')
      .on('click', function () {
        self._onSideMenuClick(this, btnGroup, d3.select(self._dropdownMenu));
      })
      .classed('disabled', tier2Categories.length < 1);

    // sidemenu for t2 categories
    const t2Dropdown = btnGroup.append('ul').classed('dropdown-menu', true);

    t2Dropdown.selectAll('.service-sub-type')
      .data(tier2Categories)
      .enter().append('li')
      .classed('service-sub-type', true)
      .attr('data-subcategory', t2 => t2)
      .append('a')
      .html(t2 => '<span class=\'glyphicon glyphicon-unchecked\'></span>' + t2)
      .on('click', (t2Category) => self._onSubCategoryClick(clickHandlers, tier1Category, t2Category, true));
    this._nameMapping[tier1Category] = { selectAllBtn, t2Dropdown };
  }

  _onSideMenuClick(elem, d3ParentBtnGroup, d3Dropdown) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    if (elem.classList.contains('disabled')) {
      return;
    }

    const currentState = d3ParentBtnGroup.classed('open');

    d3Dropdown.selectAll('.service-main-type')
      .selectAll('.btn-group.open').classed('open', false);
    d3ParentBtnGroup.classed('open', !currentState);
  }

  updateView (serviceFilterController = new ServiceFilterController()) {
    const filterAggregate = Object.keys(this._nameMapping).map(mainCategory => ({
      mainCategory,
      state: serviceFilterController.getMainCategoryState(mainCategory),
      activeSubCategories: serviceFilterController.getEnabledSubCategories(mainCategory)
    }));
    
    Object.keys(this._nameMapping).forEach(mainCategory => {
      const { selectAllBtn, t2Dropdown } = this._nameMapping[mainCategory];
      const filterInfo = filterAggregate.find(filter => filter.mainCategory === mainCategory);

      // set main category checkbox
      const mainGlyphicon = selectAllBtn.select('.glyphicon');
      mainGlyphicon.classed('glyphicon-unchecked glyphicon-plus glyphicon-check', false)
        .classed(serviceFilterController.getIconState(filterInfo.state), true);

      // set sub category checkboxes
      t2Dropdown.selectAll('.service-sub-type')
        .selectAll('.glyphicon')
        .classed('glyphicon-plus glyphicon-check', false)
        .classed('glyphicon-unchecked', true);
      filterInfo.activeSubCategories.forEach(subCategory => {
        t2Dropdown.select(`.service-sub-type[data-subcategory="${subCategory}"]`)
          .select('.glyphicon')
          .classed('glyphicon-unchecked', false)
          .classed(serviceFilterController.getIconState('all'), true);
      });
    });

    // set button text
    // const d3SelectButton = d3.select(this._buttonGroup).select('.select-btn');
    // const d3ClearButton = d3.select(this._clearBtn);
    // const activeFilters = filterAggregate.filter(({ state }) => state !== 'none');
    // if (activeFilters.length > 0) {
    //   const hasMultipleFilters = activeFilters.length > 1
    //    || (activeFilters[0].state === 'some' && activeFilters[0].activeSubCategories.length > 1);
    //   const buttonText = (hasMultipleFilters) ? 'Various Filters' : (activeFilters[0].activeSubCategories.length === 1 ? activeFilters[0].activeSubCategories[0] : activeFilters[0].mainCategory);
    //   d3SelectButton.classed('btn-default', false).classed('btn-success', true)
    //     .select('.btn-text').text(buttonText);
    //   d3ClearButton.classed('hidden', false);
    // } else {
    //   d3SelectButton.classed('btn-default', true).classed('btn-success', false)
    //     .select('.btn-text').text('Select Services...');
    //   d3ClearButton.classed('hidden', true);
    // }
  }
}
