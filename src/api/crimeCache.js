'use strict';
const DataCache = require('./DataCache');
const axios = require('axios');

module.exports = new DataCache(async () => {
  const oneWeek = 1000 /* ms/sec */ * 60 /* sec/min */ * 60 /* min/hr */ * 24 /* hrs / day */ * 7 /* days/wk */ ;
  const currentDate = new Date();
  const weekBefore = new Date(currentDate.valueOf() - oneWeek);
  let previousMonth = currentDate.getUTCMonth() - 1;
  let year = currentDate.getUTCFullYear();
  // won't have full crime data for past 7 days, so get data for 2 months before current date
  if (weekBefore.getUTCMonth() === previousMonth) {
    previousMonth -= 1;
  }
  if (previousMonth < 0) {
    previousMonth = 12 + previousMonth;
    year -= 1;
  }

  const padNumber = (num, length = 2) => num.toString().padStart(length, '0');
  const [startDate, endDate] = [
    // beginning of previous month
    new Date(`${padNumber(year, 4)}-${padNumber(previousMonth + 1)}-01T00:00:00.000Z`),
    // beginning of current month - 1 second
    new Date(new Date(`${padNumber(currentDate.getUTCFullYear())}-${padNumber(currentDate.getUTCMonth() + 1)}-01T00:00:00.000Z`).valueOf() - 1000),
  ];

  const url = 'https://data.cityofchicago.org/resource/6zsd-86xi.json';
  const whereQuery = [
    `date between '${startDate.toISOString().slice(0, -5)}' and '${endDate.toISOString().slice(0, -5)}'`,
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
  console.log(`refreshing crime data via ${fullUrl}`);
  const response = await axios.get(fullUrl);
  if (Array.isArray(response.data)) {
    console.log(`got ${response.data.length} entries`);
  }

  return {
    // return data sorted by date
    data: Array.isArray(response.data) ? response.data.sort((a, b) => new Date(a.date) - new Date(b.date)) : response.data,
    url: [url, params[0]].join('?'), // only save base url and where search
  };
}, 60 * 60 * 1000); // 1 hour
