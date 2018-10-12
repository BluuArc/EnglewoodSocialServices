// Authentication module.
const auth = require('http-auth');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');

const argv = require('yargs')
  .usage('Usage: $0 -p [integer for non-HTTPS port] -i [string of IP address] -s [integer for HTTPS port]')
  .default("p", 4000)
  .default("s", 443)
  .default("i", '')
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

const basic = auth.basic({
      file: path.join(__dirname, "admin-data", "users.htpasswd") // englewood-admin | helpthesekids
    }
);

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
        console.log("HTTPS Listening on " + this.address().address + ":" + this.address().port);
      });
    } else {
      httpsServer.listen(argv.https, function () {
        console.log("HTTPS Listening on " + this.address().address + ":" + this.address().port);
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
app.use(express.static("./"));

if(argv.ip.length > 0){
  app.listen(argv.port,argv.ip, function () {
    // console.log('Example app listening on port 4000!')
    console.log("Listening on " + this.address().address + ":" + this.address().port);
  });
}else{
  app.listen(argv.port, function () {
    // console.log('Example app listening on port 4000!')
    console.log("Listening on " + this.address().address + ":" + this.address().port);
  });
}

admin.get('/getlog', (req, res) => {
  res.sendFile(path.join(__dirname, "admin-data", "LOG.csv"));
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
  fs.writeFileSync(path.join(__dirname, "admin-data", "EnglewoodLocations.csv"), data);

  // write archiving version, also
  fs.writeFileSync(path.join(__dirname, "admin-data", "archive-data", (time + fileName)), data);

  // parse CSV
  let log = (fs.readFileSync(path.join(__dirname, "admin-data", "LOG.csv")).toString()).split("\n").map(entry => entry.split(","));
  // set existing entries to false
  log.forEach((entry) => { entry[2] = false });
  // join log entries together
  let clearedLog = log.map((entry) => entry.join(","));
  // add new entry
  clearedLog.push(`${time},${fileName},true`);
  
  // join back into csv string
  let logString = clearedLog.join("\n");

  // write updated log
  fs.writeFileSync(path.join(__dirname, "admin-data", "LOG.csv"), logString);
  // send updated log as response
  res.sendFile(path.join(__dirname, "admin-data", "LOG.csv"));
}

function changeUsedFile(timestamp, fileName, res) {
  let time = new Date(+timestamp).getTime();

  // parse CSV
  let log = (fs.readFileSync(path.join(__dirname, "admin-data", "LOG.csv")).toString()).split("\n").map(entry => entry.split(","));
  // update entries to reflect choice
  log.forEach((entry) => { entry[2] = (entry[0] == timestamp && entry[1] == fileName); });

  // copy subversion over to active data directory
  fs.copySync(path.join(__dirname, "admin-data", "archive-data", (timestamp + fileName)), path.join(__dirname, "admin-data", "EnglewoodLocations.csv"));

  // write updated log file
  fs.writeFileSync(path.join(__dirname, "admin-data", "LOG.csv"), log.map(entry => entry.join(',')).join("\n"));
  // send updated log as response
  res.sendFile(path.join(__dirname, "admin-data", "LOG.csv"));
}

initHttps();
