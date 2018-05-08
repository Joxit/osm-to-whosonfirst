#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const winston = require('../').winston;
const path = require('path');
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const keepAliveAgent = new http.Agent({ keepAlive: true });
const removeDiacritics = require('diacritics').remove;
const utils = require('../').utils;
const pointOnFeature = require('@turf/point-on-feature');

// Folder of outputs from admin-express-check; arrays of geojson features
const folder = process.argv[2];
const output = process.argv[3];
const isNew = process.argv[4];

const localities = {
  "type": "FeatureCollection",
  "name": "localities",
  "features": []
};
const localadmin = {
  "type": "FeatureCollection",
  "name": "localadmin",
  "features": []
};
const newlocalities = {
  "type": "FeatureCollection",
  "name": "newlocalities",
  "features": []
};
const localityAndLocaladmin = {
  "type": "FeatureCollection",
  "name": "newlocalities",
  "features": []
};
fs.readdirAsync(folder).map(f => {
  return path.join(folder, f);
}).map(filename => {
  return fs.readFileAsync(filename);
}).map(f => {
  return JSON.parse(f);
}).mapSeries(f => {
  const feature = f.features.shift();
  f.features.forEach(e => {
  const request = Promise.promisifyAll(require('request'));
    if (isNew) {
    } else if (e.properties['wof:placetype'] == 'localadmin') {
      feature.properties['wof:localadmin_id'] = e['id'];
    } else if (e.properties['wof:placetype'] == 'locality') {
      feature.properties['wof:locality_id'] = e['id'];
    } else {
      winston.error('Not localadmin nor locality', f.features[1].properties)
      process.exit(1);
    }
  });
  if (feature.properties['wof:locality_id'] && feature.properties['wof:localadmin_id']) {
    localityAndLocaladmin.features.push(feature);
  } else if (feature.properties['wof:localadmin_id']) {
    localadmin.features.push(feature);
  } else if (feature.properties['wof:locality_id']) {
    localities.features.push(feature);
  } else if (isNew) {
    newlocalities.features.push(feature)
  } else {
    winston.error('Not localadmin nor locality', f.features[1].properties)
    process.exit(1);
  }
}).then(() => {
  if (isNew) {
    fs.writeFileSync(output+'/newlocalities.geojson', JSON.stringify(newlocalities));
  } else {
    fs.writeFileSync(output+'/localities.geojson', JSON.stringify(localities));
    fs.writeFileSync(output+'/localadmin.geojson', JSON.stringify(localadmin));
    fs.writeFileSync(output+'/localityAndLocaladmin.geojson', JSON.stringify(localityAndLocaladmin));
  }
})