/* global MultiDropdownView CensusDataModel d3 _ CensusFilterController */
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

  _cleanMainCategoryName (name) {
    return name.split('_').map(_.capitalize).join(' ')
  }

  _addListItem(elem, tier1Category, censusDataModel = new CensusDataModel(), self, clickHandlers) {
    const tier2Categories = censusDataModel.getSubCategoriesOf(tier1Category, true);
    const btnGroup = d3.select(elem).append('div').classed('btn-group row', true);

    const buttonText = self._cleanMainCategoryName(tier1Category);
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

  _getSelectionButtonText (mainCategory, subCategory, isTotal = false) {
    if (!mainCategory || !subCategory) {
      return 'Select Census Category...';
    } else if (isTotal) {
      return `Total: ${this._cleanMainCategoryName(mainCategory)}`;
    } else if (mainCategory.startsWith('SEX_BY_AGE')) {
      const type = mainCategory.split('(')[1].replace(')', '');
      return `${this._cleanMainCategoryName(type)}: ${subCategory}`;
    } else {
      return subCategory;
    }
  }

  updateView (censusFilterController = new CensusFilterController()) {
    const { mainType, subType } = censusFilterController.activeFilter;
    const totalKey = censusFilterController.totalKey;

    Object.keys(this._nameMapping).forEach(mainCategory => {
      const { selectAllBtn, t2Dropdown } = this._nameMapping[mainCategory];

      // set main category checkbox
      const mainGlyphicon = selectAllBtn.select('.glyphicon');
      const mainIconState = censusFilterController.getIconState(censusFilterController.getMainCategoryState(mainCategory));
      mainGlyphicon.classed('glyphicon-unchecked glyphicon-plus glyphicon-check', false)
        .classed(mainIconState, true);

      // set sub category checkboxes
      const allSubCheckboxes = t2Dropdown.selectAll('.census-sub-type')
        .selectAll('.glyphicon')
        .classed('glyphicon-plus glyphicon-check', false)
        .classed('glyphicon-unchecked', true);
      if (mainCategory === mainType) {
        if (subType === totalKey) {
          allSubCheckboxes.classed('glyphicon-unchecked', false)
            .classed(censusFilterController.getIconState('all'), true);
        } else {
          t2Dropdown.select(`.census-sub-type[data-subcategory="${subType}"]`)
            .select('.glyphicon')
            .classed('glyphicon-unchecked', false)
            .classed(censusFilterController.getIconState('all'), true);
        }
      }
    });

    // set button text
    const d3SelectButton = d3.select(this._buttonGroup).select('.select-btn');
    const d3ClearButton = d3.select(this._clearBtn);
    const buttonText = this._getSelectionButtonText(mainType, subType, subType === totalKey);
    if (mainType && subType) {
      d3SelectButton.classed('btn-default', false).classed('btn-success', true)
        .select('.btn-text').text(buttonText);
      d3ClearButton.classed('hidden', false);
    } else {
      d3SelectButton.classed('btn-default', true).classed('btn-success', false)
        .select('.btn-text').text(buttonText);
      d3ClearButton.classed('hidden', true);
    }
  }
}
