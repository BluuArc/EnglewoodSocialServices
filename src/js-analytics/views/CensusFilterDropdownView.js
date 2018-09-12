/* global MultiDropdownView CensusDataModel d3 _ */
// eslint-disable-next-line no-unused-vars
class CensusFilterDropdownView extends MultiDropdownView {
  constructor(config = {}) {
    const defaultConfig = {
      buttonGroup: '#census-button-group',
      selectButton: '#census-button-group button.select-btn',
      dropdownMenu: '#census-button-group ul.dropdown-menu',
      clearButton: '#census-button-group button.clear-btn',
    };

    const getValue = (field) => config[field] || defaultConfig[field];
    super({
      buttonGroup: getValue('buttonGroup'),
      selectButton: getValue('selectButton'),
      dropdownMenu: getValue('dropdownMenu'),
      clearButton: getValue('clearButton'),
    });

    this._nameMapping = {};
  }

  init(censusDataModel = new CensusDataModel(), clickHandlers = {}) {
    const tier1Categories = censusDataModel.mainCategories;

    const dropdown = d3.select(this._dropdownMenu);
    const self = this;

    dropdown.selectAll('.census-main-type')
      .data(tier1Categories)
      .enter().append('li')
      .attr('class', 'dropdown-submenu census-main-type')
      .each(function (c1) {
        // need to pass in self as 'this' reference changes
        self._addListItem(this, c1, censusDataModel, self, clickHandlers);
      });


    if (this._hasClickHandler(clickHandlers, 'onClearButtonClick')) {
      d3.select(this._clearBtn).on('click', clickHandlers.onClearButtonClick);
    }
  }

  _addListItem(elem, tier1Category, censusDataModel = new CensusDataModel(), self, clickHandlers) {
    const tier2Categories = censusDataModel.getSubCategoriesOf(tier1Category, true);
    const btnGroup = d3.select(elem).append('div').classed('btn-group row', true);

    const buttonText = tier1Category.split('_').map(_.capitalize).join(' ');
    const selectAllBtn = btnGroup.append('button').classed('btn btn-item col-md-10', true)
      .attr('tabindex', -1)
      .html('<span class=\'glyphicon glyphicon-unchecked\'></span>' + buttonText)
      .on('click', () => self._onMainCategoryClick(clickHandlers, tier1Category));

    // side menu button
    btnGroup.append('button').classed('btn btn-item btn-dropdown col-md-2', true)
      .html('<i class="caret"></i>')
      .on('click', function () {
        self._onSideMenuClick(this, btnGroup, d3.select(self._dropdownMenu));
      })
      .classed('disabled', tier2Categories.length < 1);

    // sidemenu for t2 categories
    const t2Dropdown = btnGroup.append('ul').classed('dropdown-menu', true);

    t2Dropdown.selectAll('.census-sub-type')
      .data(tier2Categories)
      .enter().append('li')
      .classed('census-sub-type', true)
      .attr('data-subcategory', t2 => t2)
      .append('a')
      .html(t2 => '<span class=\'glyphicon glyphicon-unchecked\'></span>' + t2)
      .on('click', (t2Category) => self._onSubCategoryClick(clickHandlers, tier1Category, t2Category));
    this._nameMapping[tier1Category] = { selectAllBtn, t2Dropdown };
  }

  _onSideMenuClick(elem, d3ParentBtnGroup, d3Dropdown) {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    if (elem.classList.contains('disabled')) {
      return;
    }

    const currentState = d3ParentBtnGroup.classed('open');

    d3Dropdown.selectAll('.census-main-type')
      .selectAll('.btn-group.open').classed('open', false);
    d3ParentBtnGroup.classed('open', !currentState);
  }
}
