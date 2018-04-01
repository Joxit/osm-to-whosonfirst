const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const shapefile = require('shapefile');
const DEBUG_PREFIX = '[ReadShapefile]';

module.exports = class ReadShapefile {
  constructor({shp, dbf, evaluate, fromEPSG, toEPSG}) {
    if (!shp) {
      throw new Error(DEBUG_PREFIX + ' need shp options.');
    }
    if (typeof evaluate === 'function') {
      this.addGeoJSON = (geoJSON) => {
        return Promise.resolve(evaluate(geoJSON));
      }
    } else {
      this.addGeoJSON = this._defaultAddGeoJSON(evaluate || {});
    }
    this.opts = {};
    this.opts.shp = shp;
    this.opts.dbf = dbf;
  }
  readAsync() {
    let self = this;
    let shapefileStream = fs.createReadStream(this.opts.shp);
    let dbfStream = this.opts.dbf ? fs.createReadStream(this.opts.dbf) : null;
    return shapefile.open(shapefileStream, dbfStream)
      .then(shp => {
        let read = (result) => {
          return this.addGeoJSON(result.value).then((r) => {
            if (result.done) {
              return Promise.resolve(r);
            }
            return shp.read().then(read).catch((e) => { console.error(e, JSON.stringify(result)) });
          });
        }
        return shp.read().then(read);
    });
  }
  _defaultAddGeoJSON(evaluate) {
    let self = this;
    let result = [];
    return (geoJSON) => {
      if (!geoJSON) {
        return Promise.resolve(result);
      }
      let props = geoJSON.properties;
      geoJSON.properties = self._getProps(props, evaluate.filter);
      if (typeof evaluate.fn === 'function') {
        return Promise.resolve(evaluate.fn(geoJSON));
      }
      result.push(geoJSON);
      return Promise.resolve(result);
    };
  }
  _getProps(props, filter) {
    if (filter && props) {
      if (filter.delete instanceof Array) {
        filter.delete.forEach(e => {
          delete props[e];
        });
      }
      if (filter.keep instanceof Array) {
        Object.getOwnPropertyNames(props).filter(e => {
          return filter.keep.indexOf(e) < 0;
        }).forEach(e => {
          delete props[e];
        });
      }
    }
    return props;
  }
};