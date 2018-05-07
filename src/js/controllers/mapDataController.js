/* global d3 _ InteractiveStarPlot CensusBarChart */
'use strict';

var App = App | {};

// eslint-disable-next-line no-unused-vars
let MapDataController = function () {
  let self = {
    dataDropdownList: null,

    toggleButton: null,
    mapDataPanel: null,
    resetButton: null,
    censusResetButton: null,
    censusDropdownButton: null,
    censusDropdownList: null,
    data: null,
    lastShownProperty: null,
    censusSvg: null,

    filters: {}, // equivalent to subcategory states

    mainCategoryStates: {},
    mainStateToIcon: {
      'none': 'glyphicon-unchecked',
      'some': 'glyphicon-plus',
      'all': 'glyphicon-check'
    },

    chartList: null,
    comparisonController: null,
    mainCategoryName: 'census', // used with comparison controller
    subTypeHandlers: {},

    customCharts: {
      TENURE: {},
      VACANCY_STATUS: {},
      RACE_OF_HOUSEHOLDER: { // only input data for sub types that have custom info
        'Householder who is White alone': {
          label: ['White Alone']
        },
        'Householder who is Black or African American alone': {
          label: ['Black or African', 'American Alone']
        },
        'Householder who is American Indian and Alaska Native alone': {
          label: ['American Indian or', 'Alaska Native Alone']
        },
        'Householder who is Asian alone': {
          label: ['Asian Alone']
        },
        'Householder who is Native Hawaiian and Other Pacific Islander alone': {
          label: ['Native Hawaiian', 'and Other Pacific', 'Islander Alone']
        },
        'Householder who is Some Other Race alone': {
          label: ['Other Race Alone']
        },
        'Householder who is Two or More Races': {
          label: ['Two or More Races']
        },
      },
      RACE: {
        'White alone': {
          label: ['White Alone']
        },
        'Black or African American alone': {
          label: ['Black or African', 'American Alone']
        },
        'American Indian and Alaska Native alone': {
          label: ['American Indian or', 'Alaska Native Alone']
        },
        'Asian alone': {
          label: ['Asian Alone']
        },
        'Native Hawaiian and Other Pacific Islander alone': {
          label: ['Native Hawaiian', 'and Other Pacific', 'Islander Alone']
        },
        'Some Other Race alone': {
          label: ['Other Race Alone']
        },
        'Two or More Races': {
          label: ['Two or More Races']
        },
      },
      RACE_TOTAL_TALLIED: {
        'White alone or in combination with one or more other races': {
          label: ['White', '(Alone or Mixed)']
        },
        'Black or African American alone or in combination with one or more other races': {
          label: ['Black or African', 'American', '(Alone or Mixed)']
        },
        'American Indian and Alaska Native alone or in combination with one or more other races': {
          label: ['American Indian or', 'Alaska Native', '(Alone or Mixed)']
        },
        'Asian alone or in combination with one or more other races': {
          label: ['Asian', '(Alone or Mixed)']
        },
        'Native Hawaiian and Other Pacific Islander alone or in combination with one or more other races': {
          label: ['Native Hawaiian', 'and Other Pacific', 'Islander', '(Alone or Mixed)']
        },
        'Some Other Race alone or in combination with one or more other races': {
          label: ['Other Race', '(Alone or Mixed)']
        }
      }
    },
    activeComparisonChart: null,
    selectedBlocks: {}
  };

  function setChartList(chartList) {
    self.chartList = chartList;
  }

  function setComparisonController(controller) {
    self.comparisonController = controller;
  }

  // eslint-disable-next-line no-unused-vars
  function setDataDropdown(id) {
    self.dataDropdownList = d3.select(id);
  }

  function setCensusClearButton() {
    self.censusResetButton = d3.selectAll('#allCensusButton')
      .on('click', resetFilters);

    self.censusDropdownButton = d3.select('#censusDropdownButton');

    self.censusDropdownList = d3.select('#censusDropdownList');
  }

  function setupDataPanel(buttonID, listWrapperID) {
    self.mapDataPanel = d3.select(listWrapperID)
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('height', window.innerHeight - d3.select('.navbar').node().clientHeight + 'px');

    self.toggleButton = d3.select(buttonID).classed('open', false)
      .on('click', function () {
        let open = !d3.select(this).classed('open');
        d3.select(this).classed('open', open);

        d3.select(this).select('.glyphicon').attr('class', open ? 'glyphicon glyphicon-arrow-up' : 'glyphicon glyphicon-arrow-down');

        self.mapDataPanel
          .style('pointer-events', open ? 'all' : 'none')
          .style('opacity', open ? 1 : 0);
      });
  }

  function attachResetOverlayButton(id) {
    self.resetButton = d3.select(id)
      .on('click', resetOverlay);
  }

  function resetOverlay() {
    self.mapDataPanel.selectAll('.mapButton').each(removeMap);
    App.views.map.drawChoropleth();
    console.debug('Reset Overlay');
  }

  function createPropertyID(property_data) {
    let mainTypeTitle = property_data.mainType.split('_').map(d => `${d[0].toUpperCase()}${d.slice(1).toLowerCase()}`).join('_');
    let subTypeTitle = property_data.subType.split(' ').join('_');
    return `${mainTypeTitle}__${subTypeTitle}`.replace(/[^a-zA-Z0-9_]/g, ''); //remove any non-alpha numberic characters except underscores
  }

  function resetFilters(isConsecutiveCall = false) {
    console.trace('Reset Filters');
    self.filters = {};

    console.debug(self.mainCategoryStates);
    for (let mainCategory of Object.keys(self.mainCategoryStates)) {
      self.mainCategoryStates[mainCategory] = 'none';
    }

    removeMap();

    self.censusDropdownList.selectAll('.glyphicon')
      .attr('class', 'glyphicon glyphicon-unchecked');

    self.censusDropdownButton.selectAll('#currentServiceSelection').text('Select Census Category...');
    self.censusDropdownButton.attr('class', 'btn btn-default dropdown-toggle');

    self.censusResetButton.selectAll('#currentServiceSelection').text('Clear Selection');
    // self.censusResetButton.attr('disabled',true);
    document.getElementById('allCensusButton').style.display = 'none';


    if (self.lastShownProperty) {
      let prop = self.lastShownProperty;
      self.lastShownProperty = null;
      if (!isConsecutiveCall && self.chartList) {
        removeChartFromList(prop);
      }
    } else {
      console.debug('no last shown property found');
    }
  }

  function getFilterKey(mainType,subType){
    return `${mainType}||${subType}`; //remove any non-alpha numberic characters except underscores
  }

  function populateDropdown(categories, max_height) {
    self.data = categories;
    let tier1Categories = Object.keys(categories);

    for (let category of tier1Categories) {
      self.mainCategoryStates[category] = 'none'; // "some", "all"
    }

    self.censusDropdownList.selectAll('.mainType')
      .data(tier1Categories)
      .enter().append('li')
      .attr('class', 'dropdown-submenu serviceType')
      .each(function (c1) {
        var title = c1;
        title = title.toLowerCase();
        title = title.replace(/_/g, ' ');

        let listItem = d3.select(this);
        let btnGroup = listItem.append('div').classed('btn-group row', true);
        
        // create link within tab
        let totalBtn = btnGroup.append('button').classed('btn btn-item col-md-10', true)
          .attr('tabindex', -1)
          .attr('id', 'main_' + convertPropertyToID(c1))
          .html('<span class=\'glyphicon glyphicon-unchecked\'></span>' + title);
          // .on((L.Browser.mobile ? "click" : "mouseover"), function (d) {
          //   d3.event.stopPropagation();

          //   self.censusDropdownList.selectAll(".serviceType").classed("open", false);
          //   d3.select(this).node().parentNode.classList.toggle("open");
          // });

        btnGroup.append('button').classed('btn btn-item btn-dropdown col-md-2',true)
          .html('<span class=\'caret\'></span>')
          .on('click',function(){
            d3.event.stopPropagation();
            d3.event.preventDefault();
            if (d3.select(this).classed('disabled')) {
              return;
            }

            let parent = btnGroup;
            let parentState = parent.classed('open');

            self.censusDropdownList.selectAll('.serviceType').selectAll('.btn-group').classed('open', false)
              .selectAll('.dropdown-menu').classed('hidden',true);
            parent.classed('open', !parentState);
            parent.selectAll('.dropdown-menu').classed('hidden',!parent.classed('open'));
          }).classed('disabled', categories[c1].length < 2);

        //set total button; data should be at zero index
        totalBtn.datum({
          mainType: c1,
          subType: categories[c1][0],
          type: 'census'
        }).on('click', function(d){
          console.debug(d);
          // set other filters to allow for only one sub category selection at a time
          let isMainCategorySelection = Object.keys(self.filters).length > 1;
          for (let mainCategory of Object.keys(self.mainCategoryStates)) {
            if (mainCategory !== d.mainType) {
              self.mainCategoryStates[mainCategory] = 'none';
            }
          }
          let filterKey = getFilterKey(d.mainType, d.subType);

          self.censusDropdownList.selectAll('.glyphicon')
            .attr('class', 'glyphicon glyphicon-unchecked');
          listItem.select('ul').selectAll('.serviceSubtype') 
            .each(function (subType) {
              let curKey = getFilterKey(d.mainType, subType);

              //check all sub groups
              self.filters[curKey] = true;
              updateSubCategoryIcon(d.mainType, subType);
            });
          let curSelection = self.filters[filterKey];
          self.filters = {};

          //select current subcategory if previous filters indicate a main category selection
          if (isMainCategorySelection) {
            self.filters[filterKey] = true;
          } else {
            // toggle whether or not it is selected
            self.filters[filterKey] = !curSelection;
          }

          if (self.filters[filterKey]) {
            var button = d3.select('#censusDropdownButton');

            button.selectAll('#currentServiceSelection').text(`Total: ${_.truncate(_.capitalize(title),{length: 30})}`);
            button.attr('class', 'btn btn-success navbar-btn dropdown-toggle');

            document.getElementById('allCensusButton').style.display = '';

            addMap(d);

            chartButtonClick(d);
          } else {
            resetFilters();
          }

          updateSubCategoryIcon(d.mainType, d.subType);
          updateMainCategoryOnSubUpdate(d.mainType);
        });

        // create tab content div for this t1 category
        let secondaryDropdown = btnGroup.append('ul')
          .attr('class', 'dropdown-menu');


        secondaryDropdown.selectAll('.secondaryCategory')
          .data(categories[c1].slice(1))
          .enter().append('li')
          .attr('class', 'secondaryCategory serviceSubtype')
          .append('a')
          .datum(function (c2) {
            let property_data = {
              mainType: c1,
              subType: c2,
              type: 'census'
            };

            if (property_data.subType.indexOf('Total') > -1) {
              property_data.title = property_data.subType;
            } else if (property_data.mainType.toLowerCase().replace(/_/g, ' ').indexOf('sex by age') > -1) {
              const type = property_data.mainType.split('(')[1].split(')')[0].toLowerCase();
              property_data.title = `${_.startCase(type)}: ${property_data.subType}`;
            }
            return property_data;
          }).attr('id', d => 'sub_' + convertPropertyToID(d.subType))
          .html(function (d) {
            return '<span class=\'glyphicon glyphicon-unchecked\'></span>' + d.subType;
          })
          .on('click', function (datum) {
            //reset other filters to allow for only one sub category selection at a time
            let isMainCategorySelection = Object.keys(self.filters).length > 1;
            for (let mainCategory of Object.keys(self.mainCategoryStates)) {
              if (mainCategory !== datum.mainType) {
                self.mainCategoryStates[mainCategory] = 'none';
              }
            }
            let filterKey = getFilterKey(datum.mainType,datum.subType);

            self.censusDropdownList.selectAll('.glyphicon')
              .attr('class', 'glyphicon glyphicon-unchecked');
            listItem.select('ul').selectAll('.serviceSubtype')
              .each(function (subType) {
                let curKey = getFilterKey(datum.mainType,subType);
                if (curKey !== filterKey) {
                  self.filters[curKey] = false;

                  updateSubCategoryIcon(datum.mainType, subType);
                }
              });
            let curSelection = self.filters[filterKey];
            self.filters = {};

            //select current subcategory if previous filters indicate a main category selection
            if (isMainCategorySelection) {
              self.filters[filterKey] = true;
            } else {
              // toggle whether or not it is selected
              self.filters[filterKey] = !curSelection;
            }

            if (self.filters[filterKey]) {
              var button = d3.select('#censusDropdownButton');

              console.debug(datum, arguments);
              button.selectAll('#currentServiceSelection').text(`f${_.truncate(datum.title || datum.subType, { length: 30 })}`);
              button.attr('class', 'btn btn-success navbar-btn dropdown-toggle');

              document.getElementById('allCensusButton').style.display = '';

              addMap(datum);

              chartButtonClick(datum);
            } else {
              resetFilters();
            }

            updateSubCategoryIcon(datum.mainType, datum.subType);
            updateMainCategoryOnSubUpdate(datum.mainType);
          });

      });

    if (max_height) {
      self.censusDropdownList.selectAll('.dropdown-submenu>.dropdown-menu') //set max height of sub-dropdowns
        .style('max-height', `${max_height}px`).style('overflow-y', 'scroll');
    }
  }

  function convertPropertyToID(propertyName) {
    return propertyName.replace(/\W+/g, '_');
  }

  function addMap(d) {
    console.info('Adding map',d);
    let reducedData;
    const aggregatedMainTypes = Object.keys(self.customCharts);
    if(d.type === 'census' && aggregatedMainTypes.indexOf(d.mainType) > -1){
      console.debug('Found an aggregated type', d);
      reducedData = App.models.censusData.getSubsetGeoJSON(d, 'main');
    }else{
      reducedData = App.models.censusData.getSubsetGeoJSON(d);
    }
    let index = 0;
    App.views.map.drawChoropleth(
      reducedData, 
      d.mainType.split('').map((d) => {
        return index++ === 0 ? d.toUpperCase() : d.toLowerCase();
      }).join('').replace(/_/g,' '),
      {
        hoverHandler: (layer) => {
          if(!layer.feature.properties.fullData)
            return;

          if (self.activeComparisonChart) {
            const { chart, panel, select } = self.activeComparisonChart;
            const currentValue = select.property('value');
            if (currentValue === 'cursor') {
              self.activeComparisonChart.data[currentValue] = layer.feature.properties.fullData;
              self.activeComparisonChart.options[currentValue] = {
                ...(self.activeComparisonChart.options.default || {}),
                blockName: layer.feature.properties.blockName
              };
              console.debug(self.activeComparisonChart);
              chart.update(panel, self.activeComparisonChart.data[currentValue], self.activeComparisonChart.options[currentValue]);
            }
          }

          //update kiviat on hover
          self.chartList.updateChart(d.mainType,layer.feature.properties.fullData,
            {
              fillColor: 'rgb(134, 95, 163)',
              plotLabels: true,
              blockName: layer.feature.properties.blockName
            });
        },
        popupButtonClickHandler: (layer) => {
          const data = layer.feature.properties;
          const { geoId } = data;
          if (self.selectedBlocks[geoId]) {
            delete self.selectedBlocks[geoId];
          } else {
            self.selectedBlocks[geoId] = App.models.censusData.getDataByGeoId(geoId).properties;
            self.activeComparisonChart.data[geoId] = data.fullData;
            self.activeComparisonChart.options[geoId] = {
              ...(self.activeComparisonChart.options.default || {}),
              blockName: data.blockName
            };
          }
          console.debug(self.selectedBlocks, self.activeComparisonChart);
          updateChartDropdown();
        }
      }
    );
  }

  function updateChartDropdown() {
    const selectElem = self.activeComparisonChart.select;
    const oldValue = selectElem.property('value');
    let oldValueExists = false;
    const blockOptions = Object.keys(self.selectedBlocks)
      .map(b => ({ value: b, text: self.selectedBlocks[b].name10}));
    const options = [
      {
        value: 'cursor',
        text: 'Census Block on Cursor'
      },
      ...blockOptions
    ];

    console.debug(options);
    selectElem.selectAll('option').remove();
    selectElem.selectAll('option')
      .data(options)
      .enter().append('option')
      .each(function(o) {
        if (o.value === oldValue) {
          oldValueExists = true;
        }
        const elem = d3.select(this);
        elem.attr('value', o.value).text(o.text);
      });
    if (oldValueExists) {
      selectElem.property('value', oldValue);
    } else {
      d3.selectAll('.geoJSON-gridSpace.active-selection').classed('active-selection', false);
    }
    
    // update panel count
    const panel = self.activeComparisonChart.panel;
    const dropdownLabel = panel.select('.panel-header .form-group label');
    dropdownLabel.text(`Show data for: (${Object.keys(self.selectedBlocks).length} block(s) selected)`);
  }

  function removeMap() {
    App.views.map.drawChoropleth();
  }

  function initializeCustomCharts() {
    const englewoodData = App.models.aggregateData.englewood.data.census;
    const westEnglewoodData = App.models.aggregateData.westEnglewood.data.census;
    const overallData = App.models.censusData.getBlockLevelData();
    const blockLevelMax = {};
    const customCharts = self.customCharts;

    // get the max of every sub category at the block level
    overallData.forEach(feature => {
      const blockData = feature.properties.census;
      for(const mainType in customCharts) {
        const subTypes = App.models.censusData.getSubCategories(mainType);
        
        if (!blockLevelMax[mainType]) {
          blockLevelMax[mainType] = {};
        }

        subTypes.forEach(subType => {
          if (subType.toLowerCase().indexOf('total') === -1) {
            if (!blockLevelMax[mainType][subType]) {
              blockLevelMax[mainType][subType] = 0;
            }
            const currentMax = blockLevelMax[mainType][subType];
            blockLevelMax[mainType][subType] = Math.max(currentMax, blockData[mainType][subType]);
            // console.log('old value:', currentMax, 'new value:', blockLevelMax[mainType][subType])
          }
        });
      }
    });

    console.debug({ blockLevelMax });

    for(const mainType in customCharts) {
      const subTypes = App.models.censusData.getSubCategories(mainType);
      const overallMax = Math.max(englewoodData[mainType].Total, westEnglewoodData[mainType].Total);
      console.debug(mainType, { overallMax });

      // largest value of all subcategories between the 2 neighborhoods
      // let overallMax = 0;
      
      // subTypes.forEach(subType => {
      //     if (subType.toLowerCase().indexOf("total") === -1) {
      //       overallMax = Math.max(overallMax, englewoodData[mainType][subType], westEnglewoodData[mainType][subType])
      //     }
      //   });

      subTypes.filter(t => t !== 'Total').forEach(subType => {
        const axis = customCharts[mainType][subType] || {};

        axis.propertyName = axis.propertyName || subType;
        axis.min = +axis.min || 0;

        // uniform scale
        // axis.max = +axis.max || overallMax;

        // relative (per-axis) scale
        axis.max = blockLevelMax[mainType][subType];
        // axis.max = Math.max(englewoodData[mainType][subType],westEnglewoodData[mainType][subType]);

        axis.label = axis.label || [subType];

        axis.logScale = axis.logScale || false;

        customCharts[mainType][subType] = axis;
      });
    }

    console.debug('custom chart data',customCharts);
  }

  function generateEmptyChartData(mainType) {
    const result = {};

    for(const subType in self.customCharts[mainType]) {
      result[subType] = 0;
    }

    return result;
  }

  function chartButtonClick(d) {
    if(!self.chartList){
      console.error('No chart list specified');
      return;
    }

    if(!self.comparisonController) {
      console.error('No comparison controller specified');
      return;
    } else {
      if (!self.comparisonController.hasMainEntry(self.mainCategoryName)) {
        const mainCensusButton = self.comparisonController.addMainEntry('<i class="glyphicon glyphicon-chevron-down"></i> <b>Census</b>', self.mainCategoryName);
        mainCensusButton.selectionArea.select('button#main-header').classed('btn-default', true);
      }
    }

    if(self.lastShownProperty){
      removeChartFromList(self.lastShownProperty);
    }
    self.lastShownProperty = d;
    
    console.debug('Create chart for', d);
    if(self.customCharts[d.mainType]){
      console.debug('Create custom chart for',d);
      const title = d.mainType.split('_').map(d => `${_.capitalize(d)}`).join(' ');
      const starPlotOptions = {
        axes: Object.keys(self.customCharts[d.mainType])
          .map(k => self.customCharts[d.mainType][k]),
        labels: function (labelElement, datum, property) {
          // console.debug({ labelElement, datum, property}); 

          let label = self.customCharts[d.mainType][property].label.slice();
          let value = datum[property];

          labelElement.style('font-weight', d.subType === property ? 'bolder' : 'unset');
          labelElement.style('font-size', d.subType === property ? 'unset' : 'smaller');
          return label.concat([`(value: ${value.toFixed(0)})`]);
          // return label;
        },
        update: (panel, data, updateOptions = {}) => {
          self.censusSvg = panel.select('.panel-body svg');
          if (updateOptions.plotLabels) {
            const footer = panel.select('.panel-footer');

            footer.selectAll('p').remove();
            if (updateOptions.blockName) {
              footer.append('p').html(`<b>${updateOptions.blockName}</b>`);
            }

            if (!footer.select('table').empty()) {
              footer.selectAll('table').remove();
            }

            let table = footer.append('table').classed('container', true)
              .classed('census-table', true)
              .style('width', '100%').append('tbody');

            let propertiesLines = Object.keys(data)
              .filter(d => d.toLowerCase().indexOf('total') === -1)
              .map(d => {
                let value = data[d];
                const axisData = self.customCharts[self.lastShownProperty.mainType][d];
                const maxValue = axisData.max;
                let percent = ((value / maxValue) * 100).toFixed(2);
                return {
                  value,
                  percent,
                  label: axisData.label.join(' '),
                  total: maxValue,
                };
              });

            // let colorScale = d3.scaleLinear().domain([0, 1]);
            table.selectAll('tr').data(propertiesLines)
              .enter().append('tr')
              // .style("background-color", d => colorScale.range(["#FFF", d.color])(0.75))
              .each(function (d) {
                let row = d3.select(this);
                row.append('td').classed('align-middle', true)
                  .style('width', '47.5%').style('text-align', 'left')
                  .style('padding-left', '5px')
                  .html(`</span><b>${d.label}</b>`);
                row.append('td').classed('align-middle', true)
                  .style('width', '52.5%')
                  .text(`${d.value} of ${d.total} people/block`);
              });
          }

          if (updateOptions.printInstructions) {
            panel.select('.panel-footer').selectAll('p').remove();
            panel.select('.panel-footer').selectAll('table').remove();
            panel.select('.panel-footer')
              .append('p').text('Hover over a census block to see information');
          }
        }
      };
      let censusStarPlot = new InteractiveStarPlot(
        d.mainType, `<h4><b>${title}</b></h4>`,starPlotOptions
      );
      self.chartList.addChart(censusStarPlot);
      self.chartList.updateChart(d.mainType, {}, { renderLabels: true });
      self.chartList.updateChart(d.mainType, generateEmptyChartData(d.mainType),
        {
          fillColor: 'rgb(134, 95, 163)',
          printInstructions: true,
          plotLabels: true
        });
      // self.chartList.updateChart(d.mainType, App.models.aggregateData.westEnglewood.data.census[d.mainType], { groupID: 'westEnglewood', fillColor: App.models.aggregateData.westEnglewood.color });

      // const plotOptions = {
      //   chartMargins: {
      //     top: 5,
      //     bottom: 5,
      //     left: 50,
      //     right: 0
      //   },
      //   // width: 225
      //   width: 350
      // };

      const comparisonStarPlot = new InteractiveStarPlot(
        d.mainType, `<h4><b>${title}</b></h4>`, starPlotOptions
      );
      self.comparisonController.addSubEntry(self.mainCategoryName, title, d.mainType, (mainId, subId, graphArea) => {
        console.debug('pressed button for', d.mainType);
        self.comparisonController.setActiveSubId(mainId, subId);
        graphArea.selectAll('*').remove();
        const panel = graphArea.append('div').classed('panel starplot-panel', true);
        const header = panel.append('div').classed('panel-header', true);
        panel.append('div').classed('panel-body', true);
        panel.append('div').classed('panel-footer', true);

        const formGroup = header.append('div').classed('form-group', true);
        formGroup.append('label').text(`Show data for: (${Object.keys(self.selectedBlocks).length} block(s) selected)`);

        const select = formGroup.append('select').classed('form-control', true);
        select.on('change', () => {
          const newValue = select.property('value');
          console.debug('changed dropdown to', newValue, self.activeComparisonChart);
          d3.selectAll('.geoJSON-gridSpace.active-selection').classed('active-selection', false);
          d3.selectAll(`.geoJSON-gridSpace--${newValue}`).classed('active-selection', true);
          updateChartDropdown();
          // updateBlockData();
          self.activeComparisonChart.chart.update(
            panel,
            self.activeComparisonChart.data[newValue] || self.activeComparisonChart.data.default,
            self.activeComparisonChart.options[newValue] || self.activeComparisonChart.options.default);
        });
        select.append('option').attr('value', 'cursor').text('Census Block on Cursor');

        comparisonStarPlot.init(panel);
        comparisonStarPlot.update(panel, {}, { renderLabels: true });
        const defaultData = generateEmptyChartData(d.mainType);
        comparisonStarPlot.update(panel, defaultData,
          {
            fillColor: 'rgb(134, 95, 163)',
            printInstructions: true,
            plotLabels: true,
            blockName: 'No block selected'
          });
        self.activeComparisonChart = {
          chart: comparisonStarPlot,
          panel,
          select,
          data: {
            default: defaultData
          },
          options: {
            default: {
              fillColor: 'rgb(134, 95, 163)',
              plotLabels: true,
              blockName: 'No block selected',
              type: d,
            }
          }
        };
        updateChartDropdown();
      });
    }else{
      let title = d.title ? `<b>${d.subType}</b>` : undefined;
      const barChart = new CensusBarChart(d, createPropertyID(d), title);
      self.chartList.addChart(barChart);
      self.chartList.updateChart(createPropertyID(d));

      title = `${(d.mainType.split('_').map(_.capitalize).join(' '))}: ${d.subType}`;

      self.comparisonController.addSubEntry(self.mainCategoryName, title, createPropertyID(d), (mainId, subId, graphArea) => {
        console.debug('pressed button for', d.mainType, graphArea);
        self.comparisonController.setActiveSubId(mainId, subId);
        graphArea.selectAll('*').remove();
        graphArea.append('div').classed('panel-footer', true)
          .append('div').classed('panel-body', true);
        barChart.init(graphArea);
        barChart.update();
      });
    }

  }

  // function addChart(d) {

  //   let chartLabel = panelHeading.selectAll('.numCharts');
  //   let numCharts = +chartLabel.attr('data-count') + 1;

  //   chartLabel.attr('data-count', numCharts)
  //     .text(numCharts + (numCharts === 1 ? ' Chart' : ' Charts'))
  //     .style('display', numCharts <= 0 ? 'none' : 'inline');
  // }

  function removeChartFromList(propertyType) {
    self.censusSvg = null;
    if (self.customCharts[propertyType.mainType]) {
      self.chartList.removeChart(propertyType.mainType, true);
      try {
        self.comparisonController.deleteSubEntry(self.mainCategoryName, propertyType.mainType);
        self.activeComparisonChart = null;
      } catch (err) {
        console.error(err);
      }
    } else {
      self.chartList.removeChart(createPropertyID(propertyType), true);
      try {
        self.comparisonController.deleteSubEntry(self.mainCategoryName, createPropertyID(propertyType));
      } catch (err) {
        console.error(err);
      }
    }

    console.debug(self.comparisonController.getActiveIds());
    const { main } = self.comparisonController.getActiveIds();

    // clear out current census chart if one is active
    if (main === 'census') {
      self.comparisonController.setActiveSubId();
      self.comparisonController.resetGraphArea();
    }
  }

  function updateMainCategoryOnSubUpdate(category) {
    // console.debug(self.data[category]);
    let subcategories = self.data[category];
    let hasChecked = false;
    let hasUnchecked = false;
    let isTotal = false;

    for (let subC of subcategories) {
      let filterKey = getFilterKey(category,subC);
      if (self.filters[filterKey]) {
        if (subC.toLowerCase().indexOf('total') > -1) {
          isTotal = true;
        }
        hasChecked = true;
      } else {
        hasUnchecked = true;
      }
    }

    console.debug(self.filters);

    if (hasChecked && hasUnchecked && !isTotal) {
      self.mainCategoryStates[category] = 'some';
    } else if (hasChecked || isTotal) {
      self.mainCategoryStates[category] = 'all';
    } else {
      self.mainCategoryStates[category] = 'none';
    }

    updateMainCategoryIcon(category);
  }

  function updateMainCategoryIcon(category) {
    let id = '#main_' + convertPropertyToID(category);

    let item = self.censusDropdownList.selectAll('.serviceType ' + id);
    let selectAllButton = self.censusDropdownList.selectAll('.serviceSubtype ' + id);
    let state = self.mainCategoryStates[category];

    item.select('.glyphicon')
      .attr('class', 'glyphicon ' + self.mainStateToIcon[state]);

    if (state === 'some') {
      selectAllButton.select('.glyphicon')
        .attr('class', 'glyphicon glyphicon-unchecked');
    } else {
      selectAllButton.select('.glyphicon')
        .attr('class', 'glyphicon ' + self.mainStateToIcon[state]);
    }
  }

  function updateSubCategoryIcon(mainCategory,subCategory) {
    let id = '#sub_' + convertPropertyToID(subCategory);
    let main_id = '#main_' + convertPropertyToID(mainCategory);

    let item = d3.select(self.censusDropdownList.selectAll(main_id).node().parentNode).selectAll(id);
    let state = self.filters[getFilterKey(mainCategory,subCategory)];

    // console.debug(...arguments,main_id,id,state);

    item.select('.glyphicon')
      .attr('class', 'glyphicon ' + (state ? 'glyphicon-check' : 'glyphicon-unchecked'));
  }

  function getAxisData(mainType) {
    return self.customCharts[mainType];
  }

  function getCensusSVG() {
    return self.censusSvg;
  }

  function hasSelectedBlock(geoId) {
    return !!self.selectedBlocks[geoId];
  }

  return {
    setupDataPanel,
    attachResetOverlayButton,
    resetFilters,
    populateDropdown,
    removeChartFromList,
    setCensusClearButton,
    setChartList,
    setComparisonController,

    initializeCustomCharts,
    getAxisData,
    getCensusSVG,
    hasSelectedBlock
  };
};
