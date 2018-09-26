'use strict';

// eslint-disable-next-line no-unused-vars
const BrowserModel = function() {
  // based off of https://stackoverflow.com/questions/2324944/in-javascript-how-do-i-determine-if-my-current-browser-is-firefox-on-a-computer
  function getBrowser() {
    let agent = navigator.userAgent;
    let browsers = [
      { name: 'Edge', identifier: 'Edge' },
      { name: 'Opera', identifier: 'OPR' },
      { name: 'Opera', identifier: 'Opera' },
      { name: 'Internet Explorer', identifier: 'Trident' },
      { name: 'Internet Explorer', identifier: 'MSIE' },
      { name: 'Chrome', identifier: 'Chrome' },
      { name: 'Firefox', identifier: 'Firefox' },
      { name: 'UC Browser', identifier: 'UCBrowser' },
      { name: 'Safari', identifier: 'Safari' }, //most agents have safari in them, so may be incorrect
    ];
    let browser = browsers.reduce((acc, b) => agent.indexOf(b.identifier) > -1 ? (acc || b.name) : acc, undefined);

    return browser || 'Unknown';
  }

  function isValidBrowser() {
    return ['Firefox', 'Chrome'].indexOf(getBrowser()) > -1;
  }

  return {
    getBrowser,
    isValidBrowser
  };
};
