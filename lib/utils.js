const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisifyAll(require('mkdirp')).mkdirpAsync;
const path = require('path');
const wofIdToPath = require('pelias-whosonfirst/src/wofIdToPath');
const removeDiacritics = require('diacritics').remove;

function getGeoJSONPath(directory, id) {
  return path.join(directory, 'data', wofIdToPath(id).join(path.sep), id + '.geojson');
};

function getGeoJSON(directory, id) {
  return fs.readFileAsync(getGeoJSONPath(directory, id)).then(data => {
    return JSON.parse(data);
  });
};

function between(x, min, max) {
  return x >= min && x <= max;
}

function equals(x, y, tolerance = 0) {
  return between(x, y - tolerance, y + tolerance);
}

function areNear(c1, c2, tolerance) {
  return between(c1[0], c2[0] - tolerance, c2[0] + tolerance) && between(c1[1], c2[1] - tolerance, c2[1] + tolerance);
}

function isInBBOX(coordinates, bbox) {
  return between(coordinates[0], bbox[0], bbox[2])
      && between(coordinates[1], bbox[1], bbox[3]);
};

function writeGeoJSON(directory, geojson) {
  let geojsonPath = getGeoJSONPath(directory, geojson.id);
  let geojsonDir = path.dirname(geojsonPath);
  return mkdirpAsync(geojsonDir).then(() => {
    return fs.writeFileAsync(geojsonPath, JSON.stringify(geojson));
  });
};

function cleanName(name) {
  return removeDiacritics(name.toLowerCase()
                              .replace(/-/g, ' ')
                              .replace(/^st /, 'saint ')
                              .replace(/^ste /, 'sainte ')
                              .replace('st.', 'saint')
                              .replace('ste.', 'sainte')
                              .replace(' st ', ' saint ')
                              .replace(' ste ', ' sainte ')
                              .replace('\'', ' '))
}

module.exports = {
  equals: equals,
  areNear: areNear,
  between: between,
  getGeoJSON: getGeoJSON,
  getGeoJSONPath: getGeoJSONPath,
  isInBBOX: isInBBOX,
  writeGeoJSON: writeGeoJSON,
  cleanName: cleanName
}