/* global $ less */

function wait (time = 500, isMock = false) {
  if (isMock) {
    console.warn('mocking wait of time in ms:', time);
  }
  return new Promise(resolve => setTimeout(resolve, time));
}

function AnalyticsApp () {
  const self = this;

  self.models = {};
  self.views = {};
  self.controllers = {};

  self.init = async function () {
    console.time('app init');
    console.debug('Starting app init');
    /* eslint-disable no-undef */
    const loadingController = new LoadingMessageController();
    loadingController.mainMessage = 'Initializing Application';
    /* eslint-enable no-undef */

    await wait(2500, true);
    loadingController.mainMessage = 'Done!';
    loadingController.subMessage = '';
    await loadingController.hideMessage();
    console.debug('finished app init');
    console.timeEnd('app init');
  };
}

let App;
(() => {
  console.debug('waiting for page to load');
  const documentLoadP = new Promise(resolve => $(document).ready(resolve));
  const windowLoadP = new Promise(resolve => $(window).on('load', resolve));
  const lessCssLoadedP = less.pageLoadFinished;

  Promise.all([documentLoadP, windowLoadP, lessCssLoadedP])
    .then(() => {
      console.debug('page loaded');
      return wait();
    }).then(() => {
      App = new AnalyticsApp();
      return App.init();
    }).catch(console.error);
})();
