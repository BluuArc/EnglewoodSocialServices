/* global d3 */
'use strict';

// eslint-disable-next-line no-unused-vars
const LegendAreaViewController = function () {
  const self = {
    legend: {
      button: null,
      view: null,
      viewing: true,
      toggle: null,
    },
    comparison: {
      button: null,
      view: null,
      viewing: true,
      toggle: null,
    },
    glyphicons: {
      chevronUp: '<span class="glyphicon glyphicon-chevron-up"></span>',
      chevronDown: '<span class="glyphicon glyphicon-chevron-down"></span>'
    },
  };

  init();
  function init() {}

  function isHidden(view = d3.select()) {
    return view.classed('hidden');
  }

  function toggleLegend(value) {
    self.legend.toggle(value);
  }

  function attachLegend(viewId = '', buttonId = '') {
    self.legend.view = d3.select(viewId);
    self.legend.toggle = (value) => {
      self.legend.view = d3.select(viewId);
      const doShow = (typeof value === 'boolean') ? value : isHidden(self.legend.view);
      if (doShow) {
        self.legend.view.classed('hidden', false);
        self.legend.button.text('Collapse Legend');
        self.legend.viewing = true;
      } else {
        self.legend.view.classed('hidden', true);
        self.legend.button.text('Show Legend');
        self.legend.viewing = false;
      }
    };
    self.legend.button = d3.select(buttonId)
      .on('click', () => {
        self.legend.toggle();
      });
  }

  function toggleComparisonArea(value) {
    self.comparison.toggle(value);
  }

  function attachComparisonArea(viewId = '', buttonId = '') {
    self.comparison.view = d3.select(viewId);
    self.comparison.toggle = (value) => {
      self.comparison.view = d3.select(viewId);
      const doShow = (typeof value === 'boolean') ? value : isHidden(self.comparison.view);
      if (doShow) {
        self.comparison.view.classed('hidden', false);
        self.comparison.button.text('Collapse Comparison Area');
        self.comparison.viewing = true;
      } else {
        self.comparison.view.classed('hidden', true);
        self.comparison.button.text('Show Comparison Area');
        self.comparison.viewing = false;
      }
    };
    self.comparison.button = d3.select(buttonId)
      .on('click', () => {
        self.comparison.toggle();
      });
  }

  function getViewStateOfLegend() {
    return self.legend.viewing;
  }

  function getViewStateOfComparisonArea() {
    return self.comparison.viewing;
  }

  return {
    attachComparisonArea,
    attachLegend,

    toggleLegend,
    toggleComparisonArea,

    getViewStateOfLegend,
    getViewStateOfComparisonArea,
  };
};
