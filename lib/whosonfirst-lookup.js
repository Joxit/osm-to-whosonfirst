const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const whosonfirst = require('pelias-whosonfirst');
const PolygonLookup = require('polygon-lookup');
const winston = require('./logger');
const sink = require('through2-sink');
const _ = require('lodash');
const defaultLayers = [
  'neighbourhood',
  'borough',
  'locality',
  'localadmin',
  'county',
  'macrocounty',
  'macroregion',
  'region',
  'dependency',
  'country',
  'empire',
  'continent',
  'marinearea',
  'ocean'
];

module.exports = class WhosonfirstLookup {
  constructor({ directory, layers }) {
    let self = this;
    this.opts = {};
    this.opts.directory = directory;
    this.features = {};
    this.polygonLookup = {};
    this.opts.layers = _.intersection(defaultLayers, _.isEmpty(layers) ? defaultLayers : layers)
      .filter(layer => {
        const filename = path.join(directory, 'meta', `wof-${layer}-latest.csv`);

        if (!fs.existsSync(filename)) {
          winston.error(`unable to locate ${filename}`);
          return false;
        }
        self.features[layer] = [];
        return true;
      });;
  }
  load() {
    let self = this;
    let start = Date.now();
    return Promise.map(self.opts.layers, (layer) => {
      return new Promise((resolve, reject) => {
        let layerStart = Date.now();
        whosonfirst.metadataStream(self.opts.directory)
          .create(layer)
          .pipe(whosonfirst.parseMetaFiles())
          .pipe(whosonfirst.isNotNullIslandRelated())
          .pipe(whosonfirst.recordHasName())
          .pipe(whosonfirst.loadJSON(self.opts.directory, false))
          .pipe(whosonfirst.recordHasIdAndProperties())
          .pipe(whosonfirst.isActiveRecord())
          .pipe(sink.obj(f => {
            if (f.geometry.type === 'Polygon') {
              self.features[layer].push(f);
            }
          }))
          .on('finish', () => {
            self.polygonLookup[layer] = new PolygonLookup( { features: self.features[layer] } );
            winston.info(`${layer} loaded in ${Date.now() - layerStart} seconds`);
            resolve();
          })
          .on('error', reject);
      });
    }).then(() => {
      winston.info(`${self.opts.layers} loaded in ${Date.now() - start} seconds`);
    });
  }
  lookup({lat, long, layer}) {
    return this.polygonLookup[layer].search(long, lat);
  }
};