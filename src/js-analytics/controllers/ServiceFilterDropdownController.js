/* global d3 ServiceTaxonomyModel */
// eslint-disable-next-line no-unused-vars
class ServiceFilterDropdownController {
  constructor (config = {}) {
    const defaultConfig = {
      buttonGroup: '#service-button-group',
      selectButton: '#service-button-group button.select-btn',
      dropdownMenu: '#service-button-group ul.dropdown-menu',
      clearButton: '#service-button-group button.clear-btn',
    };

    const getValue = (field) => config[field] || defaultConfig[field];

    this._buttonGroup = document.querySelector(getValue('buttonGroup'));
    this._selectButton = document.querySelector(getValue('selectButton'));
    this._dropdownMenu = document.querySelector(getValue('dropdownMenu'));
    this._clearBtn = document.querySelector(getValue('clearButton'));

    this._mainCategoryStates = {};
  }

  get _iconStates () {
    return {
      none: 'glyphicon-unchecked',
      some: 'glyphicon-plus',
      all: 'glyphicon-check',
    };
  }

  init (serviceTaxonomyModel = new ServiceTaxonomyModel()) {
    const tier1Categories = serviceTaxonomyModel.allTier1Categories;

    tier1Categories.forEach(category => {
      this._mainCategoryStates[category] = 'none';
    });

    const dropdown = d3.select(this._dropdownMenu);
    const self = this;

    dropdown.selectAll('.service-main-type')
      .data(tier1Categories)
      .enter().append('li')
      .attr('class', 'dropdown-submenu service-main-type')
      .each(function (c1) {
        // need to pass in self 'this' reference changes
        self._addListItem(this, c1, serviceTaxonomyModel, self);
      });
  }

  _addListItem (elem, tier1Category, serviceTaxonomyModel = new ServiceTaxonomyModel(), self) {
    const tier2Categories = serviceTaxonomyModel.getTier2CategoriesOf(tier1Category);

    const btnGroup = d3.select(elem).append('div').classed('btn-group row', true);

    // select all button
    btnGroup.append('button').classed('btn btn-item col-md-10', true)
      .attr('tabindex', -1)
      .html('<span class=\'glyphicon glyphicon-unchecked\'></span>' + tier1Category)
      .on('click', () => self._onMainCategoryClick(tier1Category, elem));

    // side menu button
    btnGroup.append('button').classed('btn btn-item btn-dropdown col-md-2', true)
      .html('<i class="caret"></i>')
      .on('click', function () { self._onSideMenuClick(this, btnGroup, d3.select(self._dropdownMenu)); })
      .classed('disabled', tier2Categories.length < 1);

    // sidemenu for t2 categories
    const t2Dropdown = btnGroup.append('ul').classed('dropdown-menu', true);

    t2Dropdown.selectAll('.service-sub-type')
      .data(tier2Categories)
      .enter().append('li')
      .classed('service-sub-type', true)
      .append('a')
      .html(t2 => '<span class=\'glyphicon glyphicon-unchecked\'></span>' + t2)
      .on('click', (...args) => self._onSubCategoryClick(tier1Category, elem, ...args));
  }

  _onMainCategoryClick (c1, listItem) {
    d3.event.stopPropagation(); // prevent menu close on link click
    console.debug('clicked select all button for', c1, listItem);
  }

  _onSideMenuClick (elem, d3ParentBtnGroup, d3Dropdown) {
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

  _onSubCategoryClick () {
    d3.event.stopPropagation(); // prevent menu close on link click
    console.debug('clicked sub category', arguments);
  }
}
