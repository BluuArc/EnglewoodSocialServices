'use strict';
// Authentication module.
const auth = require('http-auth');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const axios = require('axios');

const argv = require('yargs')
  .usage('Usage: $0 -p [integer for non-HTTPS port] -i [string of IP address] -s [integer for HTTPS port]')
  .default('p', 4000)
  .default('s', 443)
  .default('i', '')
  .alias('p', 'port')
  .alias('s', 'https')
  .alias('i', 'ip').alias('i', 'ip-address')
  .describe('p', 'Port to run server on')
  .describe('i', 'IP Address to run server on')
  .describe('s', 'Port to run HTTPS server on')
  .help('h')
  .alias('h', 'help')
  .argv;

const path = require('path');
const fs = require('fs-extra');
const DataCache = require('./DataCache');

const crimeCache = new DataCache(async () => {
  const oneWeek = 1000 /* ms/sec */ * 60 /* sec/min */ * 60 /* min/hr */ * 24 /* hrs / day */ * 7 /* days/wk */;
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

const basic = auth.basic({
  file: path.join(__dirname, 'admin-data', 'users.htpasswd') // englewood-admin | helpthesekids
});

// Application setup.
const app = express();
const admin = express();

function initHttps () {
  try {
    const credentials = {
      key: fs.readFileSync('../evl2017/_.evl.uic.edu.key', 'utf8'),
      cert: fs.readFileSync('../evl2017/_.evl.uic.edu.crt', 'utf8'),
      ca: fs.readFileSync('../evl2017/_.evl.uic.edu-ca.crt', 'utf8'),
    };
    const httpsServer = https.createServer(credentials, app);
    if (argv.ip.length > 0) {
      httpsServer.listen(argv.https, argv.ip, function () {
        console.log('HTTPS Listening on ' + this.address().address + ':' + this.address().port);
      });
    } else {
      httpsServer.listen(argv.https, function () {
        console.log('HTTPS Listening on ' + this.address().address + ':' + this.address().port);
      });
    }
    return httpsServer;
  } catch (err) {
    console.log('error initializing HTTPS');
    console.log(err);
  }
}

// enable cors
app.use(cors({ origin: '*' }));

admin.use(bodyParser.json());
admin.use(auth.connect(basic));

app.use('/admin', admin);
app.use(express.static('./'));

app.get('/api/crimes', (req, res) => {
  crimeCache.getValue()
    .then(entry => res.json({
      // return data, url for query, and time of update
      data: entry.data,
      url: entry.url,
      updateTime: crimeCache.updateTime.toISOString(),
    })).catch(err => {
      console.error(err);
      res.status(500).json({ err: err.message });
    });
});

if(argv.ip.length > 0){
  app.listen(argv.port,argv.ip, function () {
    // console.log('Example app listening on port 4000!')
    console.log('Listening on ' + this.address().address + ':' + this.address().port);
  });
}else{
  app.listen(argv.port, function () {
    // console.log('Example app listening on port 4000!')
    console.log('Listening on ' + this.address().address + ':' + this.address().port);
  });
}

admin.get('/getlog', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-data', 'LOG.csv'));
});

admin.put('/savenew', (req, res) => {
  addNewFile(req.body.data, req.body.name, res);
});

admin.put('/chooseold', (req, res) => {

  changeUsedFile(req.body.time, req.body.name, res);
});

function addNewFile(data, fileName, res) {
  let time = Date.now();
  // write as new file to use
  fs.writeFileSync(path.join(__dirname, 'admin-data', 'EnglewoodLocations.csv'), data);

  // write archiving version, also
  fs.writeFileSync(path.join(__dirname, 'admin-data', 'archive-data', (time + fileName)), data);

  // parse CSV
  let log = (fs.readFileSync(path.join(__dirname, 'admin-data', 'LOG.csv')).toString()).split('\n').map(entry => entry.split(','));
  // set existing entries to false
  log.forEach((entry) => { entry[2] = false; });
  // join log entries together
  let clearedLog = log.map((entry) => entry.join(','));
  // add new entry
  clearedLog.push(`${time},${fileName},true`);
  
  // join back into csv string
  let logString = clearedLog.join('\n');

  // write updated log
  fs.writeFileSync(path.join(__dirname, 'admin-data', 'LOG.csv'), logString);
  // send updated log as response
  res.sendFile(path.join(__dirname, 'admin-data', 'LOG.csv'));
}

function changeUsedFile(timestamp, fileName, res) {
  // let time = new Date(+timestamp).getTime();

  // parse CSV
  let log = (fs.readFileSync(path.join(__dirname, 'admin-data', 'LOG.csv')).toString()).split('\n').map(entry => entry.split(','));
  // update entries to reflect choice
  log.forEach((entry) => { entry[2] = (entry[0] == timestamp && entry[1] == fileName); });

  // copy subversion over to active data directory
  fs.copySync(path.join(__dirname, 'admin-data', 'archive-data', (timestamp + fileName)), path.join(__dirname, 'admin-data', 'EnglewoodLocations.csv'));

  // write updated log file
  fs.writeFileSync(path.join(__dirname, 'admin-data', 'LOG.csv'), log.map(entry => entry.join(',')).join('\n'));
  // send updated log as response
  res.sendFile(path.join(__dirname, 'admin-data', 'LOG.csv'));
}

initHttps();
