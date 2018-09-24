/* global d3 L CensusDataModel ServiceFilterDropdownView MapView LegendView */
// eslint-disable-next-line no-unused-vars
class CensusFilterController {
  constructor ({
    dropdownView = new ServiceFilterDropdownView(),
    mapView = new MapView(),
    censusModel = new CensusDataModel(),
    legendView = new LegendView(),
  }) {
    // key = tier1 name, value = array of sub-categories
    this._states = {};

    this._dropdownView = dropdownView;
    this._mapView = mapView;
    this._activeFilter = {
      mainType: null,
      subType: null
    };
    this._censusModel = censusModel;
    this._markerViewController = null;
    this._legendView = legendView;
  }

  get _iconStates () {
    return {
      none: 'glyphicon-unchecked',
      some: 'glyphicon-plus',
      all: 'glyphicon-check',
    };
  }

  static get layerGroupName () {
    return 'censusChloropleth';
  }

  get totalKey () {
    return 'Total';
  }

  getIconState (type) {
    return this._iconStates[type];
  }

  init () {
    this._mapView.addLayerGroup(CensusFilterController.layerGroupName);

    this._dropdownView.init(this._censusModel, {
      onMainCategoryClick: (mainCategory) => { this.toggleMainCategory(mainCategory); },
      onSubCategoryClick: (mainCategory, subCategory) => { this.toggleSubCategory(mainCategory, subCategory); },
      onClearButtonClick: () => { this.reset(); },
    });
  }

  reset () {
    this._activeFilter = {
      mainType: null,
      subType: null
    };
    this.updateViews();
  }

  isMainCategoryEnabled (mainCategory) {
    return this._activeFilter.mainType === mainCategory;
  }

  isSubCategoryEnabled (mainCategory, subCategory) {
    return this.isMainCategoryEnabled(mainCategory) && this._activeFilter.subType === subCategory;
  }

  getMainCategoryState (mainCategory) {
    return (!this.isMainCategoryEnabled(mainCategory))
      ? 'none'
      : (this.isSubCategoryEnabled(mainCategory, this.totalKey))
        ? 'all'
        : 'some';
  }

  getMainCategoryGlyphicon (mainCategory) {
    return this._iconStates[this.getMainCategoryState(mainCategory)];
  }

  toggleMainCategory (category, value) {
    if (value !== undefined) { // specific toggle value
      if (value) {
        this.setActiveFilter(category, this.totalKey);
      } else {
        this.reset();
      }
    } else {
      if (this.isMainCategoryEnabled(category)) {
        this.reset();
      } else {
        this.setActiveFilter(category, this.totalKey);
      }
    }
  }

  toggleSubCategory (mainCategory, subCategory, value) {
    if (value !== undefined) { //specific toggle value
      if (value) {
        this.setActiveFilter(mainCategory, subCategory);
      } else {
        this.reset();
      }
    } else {
      if (this.isSubCategoryEnabled(mainCategory, subCategory)) {
        this.reset();
      } else {
        this.setActiveFilter(mainCategory, subCategory);
      }
    }
  }

  setActiveFilter (mainType, subType) {
    console.debug('setting new active filter', mainType, subType);
    this._activeFilter.mainType = mainType;
    this._activeFilter.subType = subType;
    this.updateViews();
  }

  get activeFilter () {
    return {
      mainType: this._activeFilter.mainType,
      subType: this._activeFilter.subType,
    };
  }

  get filteredData () {
    return this._censusModel.getSubsetGeoJson(this.activeFilter, 'main');
  }

  _generateCensusPopupHtml (geoJsonLayer) {
    const data = geoJsonLayer.feature.properties;
    const title = this._dropdownView.cleanMainCategoryName(data.description.mainType);
    const values = Object.keys(data.data || [])
      .map(name => {
        const prefix = (name === data.description.subType) ? `<b>${name}:</b>` : `${name}:`;
        return `${prefix} ${data.data[name]} ${+data.data[name] === 1 ? 'person' : 'people'}`;
      });
    return `
    <div class="container-fluid">
      <div class="row">
        <p style="margin-top: 0; margin-bottom: 8px;">
          <u><b>${title} (People per Block)</b></u>
        </p>
        ${values.join('<br>')}
      </div>
    </div>`;
  }

  _hasCensusData (dataEntry) {
    return dataEntry && Array.isArray(dataEntry.features) && dataEntry.features.length > 0;
  }

  // eslint-disable-next-line no-unused-vars
  _chloroplethGenerator (dataEntry, layerGroup, map) {
    console.debug('chloroplethGenerator', dataEntry);

    const setEnglewoodOutlineOpacityTo = (val) => {
      const englewoodOutline = this._mapView.englewoodOutline;
      if (englewoodOutline) {
        englewoodOutline.setStyle({ fillOpacity: val });
      }
    };
    if (this._hasCensusData(dataEntry)) {
      setEnglewoodOutlineOpacityTo(0);

      const colorScale = d3.scaleLinear()
        .domain(
        // take ceiling when taking extent so as not to have values equal to 0
          d3.extent(dataEntry.features, f => {
            return Math.ceil(f.properties.value * 100) / 100;
          })
        ).range(['#9ebcda', '#6e016b']);
      const chloropleth = L.geoJSON(dataEntry, {
        style: (feature) => ({
          color: colorScale(feature.properties.value),
          opacity: feature.properties.value === 0 ? 0 : 0.1,
          fillOpacity: feature.properties.value === 0 ? 0 : 0.75,
          className: `geoJson-gridSpace geoJson-gridSpace--${feature.properties.geoId}`
        }),
      }).bindPopup(
        (layer) => this._generateCensusPopupHtml(layer),
        { autoPan: false },
      ).on('click', (geoJson) => {
        console.debug(geoJson);
      });
      return chloropleth;
    } else {
      setEnglewoodOutlineOpacityTo(0.35);
    }
  }

  _generateLegendCensusScale (dataColorScale) {
    let simpleColorScale = d3.scaleLinear()
      .domain([0, 4]).range(dataColorScale.range());
    return d3.scaleQuantize()
      .domain(dataColorScale.domain()).range(d3.range(5).map((i) => simpleColorScale(i)));
  }

  updateViews () {
    this._dropdownView.updateView(this);

    const chloroplethGenerator = (dataEntry, layerGroup, map) => {
      if (this._hasCensusData(dataEntry)) {
        const colorScale = d3.scaleLinear()
          .domain(
            // take ceiling when taking extent so as not to have values equal to 0
            d3.extent(dataEntry.features, f => {
              return Math.ceil(f.properties.value * 100) / 100;
            })
          ).range(['#9ebcda', '#6e016b']);
        const title = this._dropdownView.cleanMainCategoryName(this._activeFilter.mainType);
        this._legendView.drawCensusLegend({ colorScale, title });
      } else {
        this._legendView.drawCensusLegend();
      }

      return this._chloroplethGenerator(dataEntry, layerGroup, map);
    };
    this._mapView.updateLayerGroup(
      CensusFilterController.layerGroupName,
      {
        data: [this.filteredData],
        featureGenerator: chloroplethGenerator,
      }
    );
  }
}
