/* global d3 MapIconModel */

// eslint-disable-next-line no-unused-vars
class LegendView {
  constructor (toggleButtonId = '', parentContainerId = '', mapIconModel = new MapIconModel()) {
    this._toggleButton = document.querySelector(toggleButtonId);
    this._parent = document.querySelector(parentContainerId);
    this._mapIconModel = mapIconModel;
    this._viewState = true;
    this._svg = null;
    this._censusGroup = null;

    this.initLegend();
    this._toggleButton.onclick = () => { this.viewState = !this.viewState; };
  }

  get viewState () {
    return this._viewState;
  }

  set viewState (newValue) {
    this._viewState = newValue;
    if (newValue) {
      this._svg.classed('hidden', false);
      this._toggleButton.innerText = 'Collapse Legend';
    } else {
      this._svg.classed('hidden', true);
      this._toggleButton.innerText = 'Show Legend';
    }
  }

  get _config () {
    return {
      columnWidth: 210,
      initialHeight: 150,
      id: 'map-legend',
    };
  }

  initLegend () {
    const { columnWidth, initialHeight, id } = this._config;
    this._svg = d3.select(this._parent)
      .insert('svg', ':first-child')
      .attr('width', columnWidth * 3)
      .attr('height', initialHeight)
      .attr('id', id);

    // draw left column
    const leftColumn = this._svg.append('g')
      .classed('legendOrdinal', true)
      .attr('transform', 'translate(0,0)');

    leftColumn.call(this._neighborhoodLegendConfig);
    leftColumn.select('.legendTitle')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate(62.5,0)');
    this._addMarkerD3Group(leftColumn, leftColumn.node().getBBox().height + 20);
    this._centerD3Group(leftColumn, 0);

    // draw middle column
    this._censusGroup = this._svg.append('g')
      .attr('id', 'census-group')
      .classed('legendLinear', true)
      .attr('transform', `translate(${columnWidth}, 0)`);
    this.drawCensusLegend();

    // draw right column
    const rightColumn = this._svg.append('g')
      .attr('transform', `translate(${columnWidth * 2},0)`);
    this._addLotMarkerD3Group(rightColumn, 0);
    this._centerD3Group(rightColumn, 2);

    this._svg.attr('height', Math.max(
      leftColumn.node().getBBox().height,
      rightColumn.node().getBBox().height,
    ) + 15);
  }

  get _neighborhoodLegendConfig () {
    const colorCodeScale = d3.scaleOrdinal()
      .domain(['West Englewood', 'Englewood'])
      .range(['#1f77b4', '#ff7f0e']);
    return d3.legendColor()
      .shapeWidth(30)
      .title('Neighborhood')
      .titleWidth(120)
      .scale(colorCodeScale);
  }

  _addMarkerD3Group (container, topOffset) {
    const markerLabels = [
      {
        id: 'serviceMarker',
        name: 'Service Marker'
      },
      {
        id: 'lotMarker',
        name: 'Lot Marker'
      },
      {
        id: 'schoolMarker',
        name: 'School Marker'
      }
    ];

    const lineHeight = 25;
    const markerHeight = 25;
    const topMarkerOffset = topOffset + markerHeight * 0.5;
    const topLabelOffset = topOffset + 20 * 1.25;
    const group = container.append('g');

    group.append('text')
      .classed('legendTitle', true)
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(62.5,${topOffset})`)
      .text('Markers');

    markerLabels.map(({ id, name }, index) => {
      const icon = this._mapIconModel.getSmallIconById(id);
      group.append('svg')
        .html(icon.options.html)
        .attr('x', 7.5).attr('y', topMarkerOffset + markerHeight * (index));

      group.append('text')
        .text(name).classed('label', true)
        .attr('transform', `translate(40, ${topLabelOffset + lineHeight * index})`);
    });
    return group;
  }

  _addLotMarkerD3Group (container, topOffset) {
    const markerLabels = [
      {
        id: 'Residential',
        name: 'Residential'
      },
      {
        id: 'BCM',
        name: ['Business, Commercial,', 'and Manufacturing']
      },
      {
        id: 'POS',
        name: 'Parks and Open Space'
      },
      {
        id: 'PD',
        name: ['Planned Manufacturing', 'Districts and Development']
      }
    ];

    const lineHeight = 30;
    const markerHeight = 30;
    const topMarkerOffset = markerHeight * 0.5;
    const topLabelOffset = 20 * 1.35;
    let labelOffset = 0;
    const group = container.append('g');

    group.append('text')
      .classed('legendTitle', true)
      .attr('text-anchor', 'middle')
      .attr('transform', `translate(82.5,${topOffset})`)
      .text('Lot Marker Types');

    markerLabels.map(({ id, name }, index) => {
      const labels = (Array.isArray(name) ? name : [name]);
      const icon = this._mapIconModel.getSmallIconById(id);
      group.append('svg')
        .html(icon.options.html)
        .attr('x', 5).attr('y', topMarkerOffset + markerHeight * (index));

      const labelElement = group.append('text')
        .classed('label', true)
        .attr('transform', `translate(32.5, ${topLabelOffset + labelOffset + lineHeight*index})`);
      labels.forEach((d, i) => {
        labelElement.append('tspan')
          .attr('x', 0)
          .attr('dy', i === 0 ? '0' : '1.2em')
          .text(d);
      });

      if (labels.length > 1) {
        labelOffset += lineHeight * 0.25 * (labels.length - 1);
      }
    });
    return group;
  }

  // numColumnOffset = # of columns left of group
  _centerD3Group (group, numColumnOffset) {
    const groupWidth = group.node().getBBox().width;
    const { columnWidth } = this._config;
    const leftOffset = (columnWidth * numColumnOffset) + ((columnWidth - groupWidth) / 2);
    group.attr('transform', `translate(${leftOffset}, 0)`);
  }

  drawCensusLegend (censusOptions) {
    this._censusGroup.selectAll('*').remove();
    if (!censusOptions) {
      this._censusGroup.append('text')
        .classed('legendTitle', true)
        .text('Select a census category');
    } else {
      const legendLinear = d3.legendColor()
        .shapeWidth(30)
        .labelFormat(d3.format('.0f'))
        .title(`${censusOptions.title}\n(Block Level)`)
        .titleWidth(180)
        .scale(censusOptions.colorScale);

      this._censusGroup.call(legendLinear);

      this._censusGroup.select('.legendTitle')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(62.5,0)');

      this._censusGroup.selectAll('.legendCells text.label')
        .each(function () {
          const elem = d3.select(this);
          elem.text([elem.text(), +elem.text() === 1 ? 'person' : 'people'].join(' '));
        });
    }
    this._centerD3Group(this._censusGroup, 1);
  }
}
