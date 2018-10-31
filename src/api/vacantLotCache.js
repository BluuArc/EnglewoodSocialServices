'use strict';
const DataCache = require('./DataCache');
const axios = require('axios');

module.exports = new DataCache(async () => {
  const url = 'https://data.cityofchicago.org/resource/fy8g-989r.json';
  const whereQuery = [
    // extents of Englewood Area
    'latitude between 41.75607720666332 and 41.794599284530136',
    'longitude between -87.6796718667824 and -87.62824698158252',
  ];
  const params = [
    `$where=${whereQuery.join(' and ')}`,
    '$$app_token=SmTDhtuO7GXW1Wt1eYHel6s8P',
    '$limit=25000',
  ];
  const fullUrl = [url, params.join('&')].join('?');
  console.log(`refreshing lot data data via ${fullUrl}`);
  const response = await axios.get(fullUrl);
  if (Array.isArray(response.data)) {
    console.log(`got ${response.data.length} entries`);
  }

  return {
    // return data sorted by date
    data: response.data,
    url: [url, params[0]].join('?'), // only save base url and where search
  };
}, 60 * 60 * 1000); // 1 hour
