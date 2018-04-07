#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const removeDiacritics = require('diacritics').remove;
const ReadShapefile = require('../lib/read-shapefile');
const ReprojectGeoJSON = require('../lib/reproject-geojson');
const pointOnFeature = require('@turf/point-on-feature');
const WofLookup = require('../lib/whosonfirst-lookup');
const winston = require('../lib/logger');
const features = [];
const reproject = new ReprojectGeoJSON(2154, 4326);
const shapefile = process.argv[2];
const dbf = process.argv[3];
const pipServiceUrl = process.argv[4];
if (!pipServiceUrl) {
  console.error(`Arg missing. Usage : ${process.argv[1]} shapefile dbf pip-service-url`);
  process.exit(1);
}
const wofLookup = new WofLookup({ url: pipServiceUrl, layers: ['locality', 'localadmin'] })
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
const localityAndLocaladmin = {
  "type": "FeatureCollection",
  "name": "newlocalities",
  "features": []
};
const newlocalities = {
  "type": "FeatureCollection",
  "name": "newlocalities",
  "features": []
};


const evaluate = (r) => {
  reproject.parse(r);
  let p = pointOnFeature(r).geometry.coordinates;
  wofLookup.lookup({ lat: p[0], long: p[1], layers: ['locality', 'localadmin'] }).then(body => {
    let wof = {};
    body.forEach(e => {
      if (e.Placetype == 'locality' && removeDiacritics(e.name.toLowerCase()) == removeDiacritics(r.properties.NOM_COM.toLowerCase())) {
        wof.locality = e;
      } else if (e.Placetype == 'localadmin' && removeDiacritics(e.name.toLowerCase()) == removeDiacritics(r.properties.NOM_COM.toLowerCase())) {
        wof.localadmin = e;
      }
    });
    if (wof.locality && wof.localadmin) {
      r.properties['wof:locality_id'] = wof.locality.id;
      r.properties['wof:localadmin_id'] = wof.localadmin.id;
      localityAndLocaladmin.features.push(r)
    } else if (!wof.locality && !wof.localadmin) {
      newlocalities.features.push(r)
    } else if (wof.locality) {
      r.properties['wof:locality_id'] = wof.locality.id;
      localities.features.push(r)
    } else if (wof.localadmin) {
      r.properties['wof:localadmin_id'] = wof.localadmin.id;
      localadmin.features.push(r)
    }
    winston.debug(`{ name: "${r.properties["NOM_COM"]}", locality: ${r.properties['wof:locality_id']}, localadmin: ${r.properties['wof:localadmin_id']} }`);
  });
}
const shp = new ReadShapefile({
  shp: shapefile,
  dbf: dbf,
  evaluate: { fn: evaluate, filter: { keep: ['NOM_COM'] } }
});

wofLookup.load().then(() => {
  return shp.readAsync().then(() => {
    winston.info('Reading done.');
  });
}).then(() => {
  fs.writeFileSync('localities.geojson', JSON.stringify(localities));
  fs.writeFileSync('localadmin.geojson', JSON.stringify(localadmin));
  fs.writeFileSync('localityAndLocaladmin.geojson', JSON.stringify(localityAndLocaladmin));
  fs.writeFileSync('newlocalities.geojson', JSON.stringify(newlocalities));
});