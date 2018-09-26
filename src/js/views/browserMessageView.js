/* global d3 $ */
'use strict';

// eslint-disable-next-line no-unused-vars
const BrowserMessageView = function (browserContainerDiv) {
  const self = {
    messageContainer: null,
    $messageContainer: null,
    message: null,
  };

  init();

  function init() {
    self.messageContainer = d3.selectAll(browserContainerDiv);
    self.$messageContainer = $(browserContainerDiv); //should point to modal
    self.messageContainer.selectAll('#browserAcceptButton').on('click', () => {
      hideMessage();
    });
  }

  function setBrowserName(name) {
    self.messageContainer.selectAll('#user-browser').text(name);
  }

  function showMessage() {
    self.$messageContainer.modal({
      backdrop: true,
      keyboard: false,
      show: true
    });
  }

  function hideMessage() {
    self.$messageContainer.modal('hide');
  }

  return {
    showMessage,
    hideMessage,
    setBrowserName
  };
};
