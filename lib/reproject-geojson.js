const proj4 = require('proj4')
const epsg = require('epsg')

function reprojectGeoJSON(geojson, fromEPSG, toEPSG) {
  let fromProjection = getProjection(fromEPSG);
  let toProjection = getProjection(toEPSG)
  geojson.geometry.coordinates = reprojectCoordinates(geojson.geometry.coordinates, fromProjection, toProjection);
  return geojson;
}

function reprojectCoordinates(coordinates, fromProjection, toProjection) {
  if (coordinates instanceof Array && coordinates[0] instanceof Array) {
    return coordinates.map((e) => {
      return reprojectCoordinates(e, fromProjection, toProjection);
    });
  }
  return proj4(fromProjection, toProjection, coordinates);
}

function getProjection(proj) {
  if (!isNaN(proj)) {
    return epsg['EPSG:' + proj];
  } else if (typeof proj === 'string' && proj.toUpperCase().startsWith('EPSG:')) {
    return epsg[proj.toUpperCase()];
  }
  return proj;
}

module.exports = reprojectGeoJSON;
module.exports.getProjection = getProjection;
module.exports.reprojectCoordinates = reprojectCoordinates;