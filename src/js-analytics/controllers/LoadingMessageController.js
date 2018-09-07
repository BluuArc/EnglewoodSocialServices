/* global d3 */
// eslint-disable-next-line no-unused-vars
class LoadingMessageController {
  constructor (config = {}) {
    const defaultConfig = {
      containerElem: '#loading-indicator',
      mainMessageElem: '#loading-indicator #loading-message-title',
      subMessageElem: '#loading-indicator #loading-message-subtitle',
    };

    // assumption: only one instance of each selector is present
    this.containerElem = document.querySelector(config.containerElem || defaultConfig.containerElem);
    this.mainMessageElem = document.querySelector(config.mainMessageElem || defaultConfig.mainMessageElem);
    this.subMessageElem = document.querySelector(config.subMessageElem || defaultConfig.subMessageElem);
    this.containerD3 = d3.select(this.containerElem);
  }

  set messageIsVisible (bool) {
    const classList = this.containerElem.classList;
    if (!bool) {
      classList.add('hidden');
    } else {
      classList.remove('hidden');
    }
  }

  set mainMessage (msg) {
    this.showMessage();
    this.mainMessageElem.textContent = msg;
  }

  set subMessage (msg) {
    this.showMessage();
    this.subMessageElem.textContent = msg;
  }

  showMessage () {
    this.messageIsVisible = true;
  }

  hideMessage () {
    const animationP = new Promise(resolve => {
      this.containerD3
        .transition().duration(1000)
        .style('opacity', 0)
        .on('end', resolve);
    });
    return animationP.then(() => { this.messageIsVisible = false; });
  }
}
