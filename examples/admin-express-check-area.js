#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const area = require('@turf/area').default;
const winston = require('../').winston;
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const keepAliveAgent = new http.Agent({ keepAlive: true });
const utils = require('../').utils;
const removeDiacritics = require('diacritics').remove;

const folder = process.argv[2];
const wofPath = process.argv[3];
const output = process.argv[4];

fs.readdirAsync(folder).map(f => {
  return path.join(folder, f);
}).map(filename => {
  return fs.readFileAsync(filename);
}).map(f => {
  return JSON.parse(f).features;
}).mapSeries(f => {
  f.properties['area'] = area(f.geometry);
  if (Array.isArray(f.properties['pip:body']) || f.properties['pip:body'].length > 0) {
    return Promise.filter(f.properties['pip:body'], e => {
      return e.Placetype != 'localadmin';
    }).map(e => {
      return utils.getGeoJSON(wofPath, e.Id);
    }).map(e => {
      f.properties['pip:area'] = f.properties['pip:area'] || {};
      f.properties['pip:area'][e.id] = area(e.geometry);
    }).then(() => {
      return f;
    });
  }
  return f;
}).filter(f => {
  if (f.properties['pip:area']) {
    for (var i in f.properties['pip:area']) {
      if (utils.equals(f.properties['area'], f.properties['pip:area'][i], f.properties['area'] * 0.2)) {
        return true;
      }
    }
  }
}).then(console.log)