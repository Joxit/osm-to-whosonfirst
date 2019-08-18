#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const removeDiacritics = require('diacritics').remove;
const ReadShapefile = require('../').ReadShapefile;
const ReprojectGeoJSON = require('../').ReprojectGeoJSON;
const pointOnFeature = require('@turf/center-of-mass').default;
const WofLookup = require('../').whosonfirst.Lookup;
const winston = require('../').winston;
const path = require('path');
const features = [];
const reproject = new ReprojectGeoJSON(2154, 4326);
const shapefile = process.argv[2];
const pipServiceUrl = process.argv[3];
const output = process.argv[4] || './';
if (!pipServiceUrl) {
  console.error(`Arg missing. Usage : ${process.argv[1]} shapefile pip-service-url output`);
  process.exit(1);
}
const wofLookup = new WofLookup({ directory: pipServiceUrl.startsWith('/') ? pipServiceUrl : null, url: pipServiceUrl.startsWith('/') ? null : pipServiceUrl, layers: ['locality', 'localadmin'] })
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

function clean(name) {
  return removeDiacritics(name.toLowerCase().replace(/-/g, ' ').replace('st.', 'saint').replace('ste.', 'sainte'))
}

function lookupLocalityAndLocaladmin(p) {
  return Promise.all([
    wofLookup.lookup({ lat: p[1], long: p[0], layers: ['locality'] }),
    wofLookup.lookup({ lat: p[1], long: p[0], layers: ['localadmin'] })
  ]).then(res => {
    return res[0].concat(res[1]);
  });
}

const evaluate = (r) => {
  reproject.parse(r);
  let p = pointOnFeature(r).geometry.coordinates;
  lookupLocalityAndLocaladmin(p).then(body => {
    let wof = {};
    body.forEach(e => {
      if (e.Placetype == 'locality' && clean(e.name || e.Name) == clean(r.properties.NOM_COM)) {
        wof.locality = e;
      } else if (e.Placetype == 'localadmin' && clean(e.name || e.Name) == clean(r.properties.NOM_COM)) {
        wof.localadmin = e;
      }
    });
    r.properties['pip:center'] = p;
    r.properties['pip:body'] = body;
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
  evaluate: { fn: evaluate }
});

wofLookup.load().then(() => {
  return shp.readAsync().then(() => {
    winston.info('Reading done.');
  });
}).then(() => {
  fs.writeFileSync(path.join(output, 'localities.geojson'), JSON.stringify(localities));
  fs.writeFileSync(path.join(output, 'localadmin.geojson'), JSON.stringify(localadmin));
  fs.writeFileSync(path.join(output, 'localityAndLocaladmin.geojson'), JSON.stringify(localityAndLocaladmin));
  fs.writeFileSync(path.join(output, 'newlocalities.geojson'), JSON.stringify(newlocalities));
}).catch(winston.error).finally(() => { process.exit(0); });