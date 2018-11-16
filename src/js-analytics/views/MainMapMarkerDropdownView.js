// usage is to initialize the main dropdowns used in each slot by the Map Markers selector
// eslint-disable-next-line no-unused-vars
class MainMarkerDropdownView {
  constructor (
    mainMarkerDropdownSelector,
    buttonGroupSelector) {
    const mainMarkerDropdown = document.querySelector(mainMarkerDropdownSelector);
    this._buttonGroup = mainMarkerDropdown.querySelector(buttonGroupSelector);
    this._allButton = this._buttonGroup.querySelector('.btn[tabindex="-1"]');
    this._dropdownButton = this._buttonGroup.querySelector('.btn.map-marker-subdropdown-toggle');
    this._dropdown = this._buttonGroup.querySelector('ul.dropdown-menu[role="menu"]');

    this._dropdownButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Array.from(mainMarkerDropdown.querySelectorAll('.open')).forEach(elem => {
        if (elem !== this._buttonGroup) {
          elem.classList.remove('open');
        }
      });
      this._buttonGroup.classList.toggle('open');
    });
  }

  static get viewStateClasses () {
    return {
      ALL: 'glyphicon-check',
      SOME: 'glyphicon-plus',
      NONE: 'glyphicon-unchecked',
    };
  }

  get allButton () {
    return this._allButton;
  }

  get dropdown () {
    return this._dropdown;
  }

  updateGlyphicon (glyphiconClass) {
    const glyphicon = this._allButton.querySelector('.glyphicon');
    glyphicon.classList.value = `glyphicon ${glyphiconClass}`;
  }
}
