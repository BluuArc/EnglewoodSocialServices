/* global $ d3 */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
let ListToMapLinkingController = function() {
  function mapMarkerSelected(data) {
    let parentDiv = $('#serviceList');
    let dPanel = d3.selectAll('.serviceEntry')
      .filter((d) => d['Organization Name'] === data['Organization Name']);

    let innerListItem = $(dPanel.nodes());

    // parentDiv.animate({
    //     scrollTop: parentDiv.scrollTop() + (innerListItem.position().top - parentDiv.position().top) - parentDiv.height()/2 + innerListItem.height()/2
    // }, 500);

    let expanded = !dPanel.selectAll('.collapse').classed('in');
    data.expanded = expanded;

    d3.selectAll('#serviceList').selectAll('.serviceEntry').classed('opened', false);
    dPanel.classed('opened', expanded);

    // $(".serviceEntry.collapse").collapse("hide");
    // $(".collapse", innerListItem).collapse(expanded ? "show" : "hide");
    $('.panel-heading', innerListItem).trigger('click');

    document.getElementById('serviceList').scrollTop = document.getElementById('serviceList').scrollTop + (innerListItem.position().top - parentDiv.position().top) - parentDiv.height()/2 + innerListItem.height()/2;

    App.views.map.setSelectedService(expanded ? data : null);
  }

  function listServiceSelected(data) {
    if (!data || (data && data.Latitude.length > 0 && data.Longitude.length > 0))
      App.views.map.setSelectedService(data);
  }


  return {
    mapMarkerSelected,
    listServiceSelected
  };
};
