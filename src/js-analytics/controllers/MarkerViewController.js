// eslint-disable-next-line no-unused-vars
class MarkerViewController {
  constructor (buttonSelector, toggleOff, toggleOn, initialState) {
    this._button = document.querySelector(buttonSelector);
    this._buttonSymbol = this._button.querySelector('.glyphicon');
    this._toggleOff = toggleOff;
    this._toggleOn = toggleOn;
    this.viewState = initialState ? true : false;

    this._button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
  }

  set viewState (newValue) {
    if (newValue) {
      this._buttonSymbol.classList.remove('glyphicon-unchecked');
      this._buttonSymbol.classList.add('glyphicon-check');
      this._buttonSymbol.classList.add('success');
      this._toggleOn();
    } else {
      this._buttonSymbol.classList.remove('success');
      this._buttonSymbol.classList.remove('glyphicon-check');
      this._buttonSymbol.classList.add('glyphicon-unchecked');
      this._toggleOff();
    }
    this._viewState = newValue;
  }

  get viewState () {
    return this._viewState;
  }

  toggle (value) {
    this.viewState = (value !== undefined) ? !!value : !this.viewState;
  }
}
