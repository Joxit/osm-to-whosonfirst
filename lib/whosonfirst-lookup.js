const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const winston = require('./logger');
const sink = require('through2-sink');
const _ = require('lodash');
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const keepAliveAgent = new http.Agent({ keepAlive: true });

module.exports = class WhosonfirstLookup {
  constructor({ directory, layers = [], url }) {
    let self = this;
    this.opts = {};
    this.opts.directory = directory;
    this.opts.url = url;
    this.features = {};
    this.opts.layers = layers;
  }
  load() {
    let self = this;
    let start = Date.now();
    return new Promise((resolve, reject) => {
      if (self.opts.url) {
        self.pipService = {
          lookup: (lat, long, layer, cb) => {
          request.getAsync({
            baseUrl: self.opts.url,
            url: `${lat}/${long}`,
            agent: keepAliveAgent,
            qs: {layers: self.opts.layers.join(',')}
          }).then(res => {
            let body = JSON.parse(res.body);
            let result = [];
            for (let i in body) {
              result = result.concat(body[i].map(e => {
                e.Placetype = i;
                return e;
              }))
            }
            cb(null, result);
          }).catch(cb)
        }
        };
        return resolve();
      }
       require('pelias-wof-admin-lookup/src/pip/index').create(self.opts.directory, _.defaultTo(self.opts.layers, []), false, (err, service) => {
         if(err) {
           return reject(err);
         }
        self.pipService = service;
        resolve();
      });
    }).then(() => {
      winston.info(`Loaded in ${(Date.now() - start) / 1000} seconds`);
    });
  }
  lookup({lat, long, layers = []}) {
    return new Promise((resolve, reject) => {
      this.pipService.lookup(lat, long, (typeof layers == 'string' ? [layers] : layers), (err, result) => {
        if(err) {
          return reject(err);
        }
        resolve(result.filter((e) => {
          return layers.length == 0 || layers.some(l => {
            return e.Placetype == l;
          });
        }));
      });
    });
  }
};