/* global d3 _ */
'use strict';

var App = App || {};

// eslint-disable-next-line no-unused-vars
const ServiceDataModel = function() {
  const self = {
    data: null,

    filters: {},
    searchTerm: ''
  };

  init();
  function init() {}

  function loadTextData(path) {
    return new Promise((resolve, reject) => {
      d3.text(path, (error, text) => {
        if (error) reject(error);
        else resolve(text);
      });
    });
  }

  function createServiceObjectFromHeaders(headers, data) {
    const result = {};
    const removeExtraQuotes = (str) => {
      return JSON.parse(
        JSON.stringify(str, null, 2)
          .replace(/"\\"/g, '"').replace(/\\""/g, '"')
      );
    };

    // assumption: all meta-data besides service type occurs before service type data
    // assumption: main category of service name occurs before sub-categories
    let lastKnownMainCategory;
    headers.forEach((h, i) => {
      const header = h.replace(/"/g, ' ').trim(); // remove extraneous characters
      const code = App.models.serviceTaxonomy.getCategoryCodeOf(header);
      if (code) {
        result[`${code}||*`] = data[i];
        lastKnownMainCategory = code;
      } else if (lastKnownMainCategory) {
        result[`${lastKnownMainCategory}||${header}`] = data[i];
      } else {
        result[header] = removeExtraQuotes(data[i] === undefined ? '' : data[i]);
      }
    });
    return result;
  }

  async function loadData(dataPath) {
    const textData = await loadTextData(dataPath);
    const isAlphaNumeric = (charInput = '') => {
      const lcInput = charInput.toLowerCase();
      return (lcInput >= '0' && lcInput <= '9') || (lcInput >= 'a' && lcInput <= 'z');
    };

    // make line breaks uniform
    let lines = textData.replace(/\r/g, '\n');
    while (lines.indexOf('\n\n') > -1) {
      lines = lines.replace(/\n\n/g, '\n');
    }
    lines = lines.split('\n');

    // combine lines that weren't meant to be split
    // for example: descriptions with new lines
    const fixedLines = [];
    let curLine = lines[0].trim();
    lines.forEach(line => {
      if (line === undefined) {
        return;
      }
      const workingLine = line.trim();
      if (isAlphaNumeric(workingLine[0]) || isAlphaNumeric(workingLine[1])) {
        fixedLines.push(curLine);
        curLine = workingLine;
      } else {
        curLine += `\n${workingLine}`;
      }
    });
    if (curLine) {
      fixedLines.push(curLine);
    }

    // remove duplicate at index 0
    fixedLines.shift();

    console.debug({ lines });

    // convert to CSV form (array of lines, where each line is an array of columns)
    const csv = fixedLines.map(line => {
      const lineData = line.split(',');
      const parsedData = [];
      let curLine = lineData[0];
      lineData.forEach(d => {
        if (d.charAt(0) === ' ') {
          curLine += `,${d}`;
        } else {
          parsedData.push(curLine.trim());
          curLine = d;
        }
      });
      if (curLine) {
        parsedData.push(curLine.trim());
      }
      // remove duplicate at index 0
      parsedData.shift();
      return parsedData;
    });

    const headers = csv.shift();
    self.data = csv.map(d => createServiceObjectFromHeaders(headers, d));
    return;
  }

  function getData() {
    return self.data;
  }

  function getFilteredData(serviceFilters) {
    self.filters = serviceFilters;
    return getSearchAndFilterSubset();
  }

  function getSearchedData(term = '') {
    self.searchTerm = term.toLowerCase();
    return getSearchAndFilterSubset();
  }

  function getSearchAndFilterSubset() {
    const filteredData = Object.keys(self.filters).length === 0 ? self.data :
      _.filter(self.data, el => Object.keys(self.filters).filter(property => el[property] == 1).length > 0);

    const searchData = self.searchTerm.length === 0 ? self.data :
      _.filter(self.data, el => _.includes(_.lowerCase(el['Organization Name']), self.searchTerm));

    return _.intersection(filteredData, searchData);

  }

  function getDataByFilter(filterFn) {
    return _.filter(self.data, filterFn);
  }

  function getDataWithinBounds(bounds) {
    let lat = d3.extent(bounds, b => b.lat);
    let lng = d3.extent(bounds, b => b.lng);

    // return _.filter(self.data, service => service.Y >= lat[0] && service.Y < lat[1] && service.X >= lng[0] && service.X < lng[1]);
    return getDataByFilter((service) => {
      let serviceLat = +service.Latitude, serviceLng = +service.Longitude;
      return serviceLat >= lat[0] && serviceLat < lat[1] && serviceLng >= lng[0] && serviceLng < lng[1];
    });
  }

  return {
    loadData,
    getData,
    getFilteredData,
    getSearchedData,
    getDataWithinBounds,
    getDataByFilter
  };
};
