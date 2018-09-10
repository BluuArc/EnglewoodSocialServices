/* global d3 ServiceTaxonomyModel */

// eslint-disable-next-line no-unused-vars
class SocialServiceModel {
  constructor(dataPath = '') {
    this._dataPath = dataPath;
    this._data = null;
  }

  _loadTextData (altPath = '') {
    return new Promise((resolve, reject) => {
      d3.text(altPath || this._dataPath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  _cleanCsvData (textData) {
    const isAlphaNumeric = (charInput = '') => {
      const lcInput = charInput.toLowerCase();
      return (lcInput >= '0' && lcInput <= '9') || (lcInput >= 'a' && lcInput <= 'z');
    };

    // make line breaks uniform
    let lines = textData.replace(/\r/g, '\n');
    while (lines.includes('\n\n')) {
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
    return csv;
  }

  _createServiceObjectFromHeaders(headers, data, serviceTaxonomyModel = new ServiceTaxonomyModel()) {
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
      const code = serviceTaxonomyModel.getCategoryCodeOf(header);
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

  async load (altPath = '', serviceTaxonomyModel = new ServiceTaxonomyModel()) {
    console.debug('loading social service data');
    const textData = await this._loadTextData(altPath);
    const csvData = this._cleanCsvData(textData);
    const [headers, ...data] = csvData;
    this._data = data.map(d => this._createServiceObjectFromHeaders(headers, d, serviceTaxonomyModel));
    console.debug('finished', this._data);
  }

  getData (filterFn) {
    return typeof filterFn === 'function' ? this._data.filter(filterFn) : this._data.slice();
  }
}
