#!/usr/bin/env node
const sink = require('through2-sink');
const through2 = require('through2');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const area = require('@turf/area').default;
const winston = require('../').winston;
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const keepAliveAgent = new http.Agent({ keepAlive: true });
const utils = require('../').utils;
const whosonfirstStream = require('../').whosonfirst.stream;
const removeDiacritics = require('diacritics').remove;
const WofLookup = require('../').whosonfirst.Lookup;

const wofPath = process.argv[2];
const output = process.argv[3];

const wofLookup = new WofLookup({ directory: wofPath, layers: ['localadmin'] })

wofLookup.load().then(() => {
  whosonfirstStream({datapath: wofPath, layer: 'locality', country: 'FR'})
    .pipe(through2.obj((e, enc, callback) => {
      return wofLookup.lookup({ lat: e.properties['geom:latitude'], long: e.properties['geom:longitude'], layers: ['localadmin'] })
      .then(l => {
        console.log(e.properties, JSON.stringify(l))
        return callback(null,  e);
      })

    }))
    .pipe(sink.obj(() => {}))
    .on('finish', o => {
      console.log('done');
      process.exit(0);
    })
});