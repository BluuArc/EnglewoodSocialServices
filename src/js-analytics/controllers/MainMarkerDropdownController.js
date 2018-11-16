/* global MainMarkerDropdownView */

// eslint-disable-next-line no-unused-vars
class MainMarkerDropdownController {
  constructor (view = new MainMarkerDropdownView(), onToggleAll = (state) => { console.debug(state); }) {
    this._view = view;
    this._onToggleAll = onToggleAll;

    this._state = MainMarkerDropdownController.states.NONE;

    this._view.allButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.state = this.getNextState(this._state);
    });
  }

  static get states () {
    return {
      ALL: 'ALL',
      SOME: 'SOME',
      NONE: 'NONE',
    };
  }

  getNextState (oldState) {
    const states = MainMarkerDropdownController.states;
    if (oldState === states.ALL) {
      return states.NONE;
    } else {
      return states.ALL;
    }
  }

  set state (newState) {
    this._state = newState;
    this._onToggleAll(newState);
    this._view.updateGlyphicon(MainMarkerDropdownView.viewStateClasses[newState]);
  }

  get state () {
    return this._state;
  }
}
