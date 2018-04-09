/* global d3 */
'use strict';

// eslint-disable-next-line no-unused-vars
const LegendAreaViewController = function () {
  const self = {
    legend: {
      button: null,
      view: null,
    },
    comparison: {
      button: null,
      view: null,
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

  function attachLegend(viewId = '', buttonId = '') {
    self.legend.view = d3.select(viewId);
    self.legend.button = d3.select(buttonId)
      .on('click', () => {
        if (isHidden(self.legend.view)) {
          self.legend.view.classed('hidden', false);
          self.legend.button.text('Collapse Legend');
        } else {
          self.legend.view.classed('hidden', true);
          self.legend.button.text('Show Legend');
        }
      });
  }

  function attachComparisonArea(viewId = '', buttonId = '') {
    self.comparison.view = d3.select(viewId);
    self.comparison.button = d3.select(buttonId)
      .on('click', () => {
        if (isHidden(self.comparison.view)) {
          self.comparison.view.classed('hidden', false);
          self.comparison.button.text('Collapse Comparison Area');
        } else {
          self.comparison.view.classed('hidden', true);
          self.comparison.button.text('Show Comparison Area');
        }
      });
  }

  return {
    attachComparisonArea,
    attachLegend
  };
};
