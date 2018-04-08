const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisifyAll(require('mkdirp')).mkdirpAsync;
const path = require('path');
const wofIdToPath = require('pelias-whosonfirst/src/wofIdToPath');

function getGeoJSONPath(directory, id) {
  return path.join(directory, 'data', wofIdToPath(id).join(path.sep), id + '.geojson');
};

function getGeoJSON(directory, id) {
  return fs.readFileAsync(getGeoJSONPath(directory, id)).then(data => {
    return JSON.parse(data);
  });
};

function writeGeoJSON(directory, geojson) {
  let geojsonPath = getGeoJSONPath(directory, geojson.id);
  let geojsonDir = path.dirname(geojsonPath);
  return mkdirpAsync(geojsonDir).then(() => {
    return fs.writeFileAsync(geojsonPath, JSON.stringify(geojson));
  });
};

module.exports = {
  getGeoJSON: getGeoJSON,
  getGeoJSONPath: getGeoJSONPath,
  writeGeoJSON: writeGeoJSON
}