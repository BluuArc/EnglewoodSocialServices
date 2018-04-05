'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let BrowserMessageController = function () {
  let self = {
    model: undefined,
    view: undefined
  };

  function init() {
    self.model = App.models.browser;
    self.view = App.views.browserMessage;
  }
  init();

  function runBrowserCheck() {
    if(!self.model.isValidBrowser()){
      self.view.setBrowserName(self.model.getBrowser());
      self.view.showMessage();
    }else{
      self.view.hideMessage();
    }
  }

  return {
    runBrowserCheck
  };
};
