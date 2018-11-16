// eslint-disable-next-line no-unused-vars
class MarkerViewController {
  constructor (buttonSelector, toggleOff, toggleOn, initialState, stopEventPropagation = false) {
    this._button = document.querySelector(buttonSelector);
    this._buttonSymbol = this._button.querySelector('.glyphicon');
    this._toggleOff = toggleOff;
    this._toggleOn = toggleOn;
    this._preUpdateEventHandlers = {};
    this.viewState = initialState ? true : false;

    this._button.addEventListener('click', (e) => {
      e.preventDefault();
      // useful for keeping a dropdown open when button is clicked
      if (stopEventPropagation) {
        e.stopPropagation();
      }
      this.toggle();
    });
  }

  set viewState (newValue) {
    this._viewState = newValue;
    this.updateView();
  }

  get viewState () {
    return this._viewState;
  }

  addPreUpdateEventHandler (key, fn) {
    this._preUpdateEventHandlers[key] = fn;
  }

  deletePreUpdateEventHandler (key) {
    delete this._preUpdateEventHandlers[key];
  }

  updateView () {
    Object.keys(this._preUpdateEventHandlers).forEach(handlerKey => {
      this._preUpdateEventHandlers[handlerKey](this._viewState);
    });
    if (this._viewState) {
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
  }

  toggle (value) {
    this.viewState = (value !== undefined) ? !!value : !this.viewState;
  }
}
