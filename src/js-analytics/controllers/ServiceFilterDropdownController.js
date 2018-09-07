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
    const addListItem = this._addListItem;
    const onMainCategoryClick = this._onMainCategoryClick;
    const onSideMenuClick = this._onSideMenuClick;

    dropdown.selectAll('.main-type')
      .data(tier1Categories)
      .enter().append('li')
      .attr('class', 'dropdown-submenu service-type main-type')
      .each(function (c1) {
        addListItem(this, c1, serviceTaxonomyModel, { onMainCategoryClick, onSideMenuClick });
      });
  }

  _addListItem (elem, tier1Category, serviceTaxonomyModel = new ServiceTaxonomyModel(), { onMainCategoryClick, onSideMenuClick }) {
    const tier2Categories = serviceTaxonomyModel.getTier2CategoriesOf(tier1Category)
      .map(c2 => ({ mainType: tier1Category, subType: c2 }));

    const btnGroup = d3.select(elem).append('div').classed('btn-group row', true);

    // select all button
    btnGroup.append('button').classed('btn btn-item col-md-10', true)
      .attr('tabindex', -1)
      .html('<span class=\'glyphicon glyphicon-unchecked\'></span>' + tier1Category)
      .on('click', () => onMainCategoryClick(tier1Category, elem));

    // side menu button
    btnGroup.append('button').classed('btn btn-item btn-dropdown col-md-2', true)
      .html('<i class="caret"></i>')
      .on('click', function () { onSideMenuClick(this, btnGroup); })
      .classed('disabled', tier2Categories.length < 1);
  }

  _onMainCategoryClick (c1, listItem) {
    console.debug('clicked select all button for', c1, listItem);
  }

  _onSideMenuClick (elem, d3BtnGroup) {
    console.debug('clicked side menu', elem, d3BtnGroup);
  }
}
