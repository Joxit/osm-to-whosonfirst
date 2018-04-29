#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const removeDiacritics = require('diacritics').remove;
const ReadShapefile = require('../').ReadShapefile;
const ReprojectGeoJSON = require('../').ReprojectGeoJSON;
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const keepAliveAgent = new http.Agent({ keepAlive: true });
const pointOnFeature = require('@turf/point-on-feature');
const utils = require('../').utils;
const winston = require('../').winston;
const queue = require('queue');
const features = [];
const reproject = new ReprojectGeoJSON(2154, 4326);
const q = queue({
  concurrency: 20,
  autostart: true
});
const v8 = require('v8');
v8.setFlagsFromString('--max_old_space_size=4096');
const start = Date.now();
const shapefile = process.argv[2];
const dbf = process.argv[3];
const peliasURL = process.argv[4];
if (!peliasURL) {
  console.error(`Arg missing. Usage : ${process.argv[1]} shapefile dbf pelias-url`);
  process.exit(1);
}
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

function updateProperties(shpFeature) {
  return (peliasFeature) => {
    if (peliasFeature.properties.localadmin && clean(peliasFeature.properties.localadmin) == clean(shpFeature.properties.NOM_COM)) {
      shpFeature.properties['wof:localadmin_id'] = peliasFeature.properties.localadmin_gid.split(':')[2];
    }
    if (peliasFeature.properties.locality && clean(peliasFeature.properties.locality) == clean(shpFeature.properties.NOM_COM)) {
      shpFeature.properties['wof:locality_id'] = peliasFeature.properties.locality_gid.split(':')[2];
    }
  }
}

function addFeature(shpFeature, fnNotFound) {
  if (shpFeature.properties['wof:locality_id'] && shpFeature.properties['wof:localadmin_id']) {
    localityAndLocaladmin.features.push(shpFeature)
  } else if (!shpFeature.properties['wof:locality_id'] && !shpFeature.properties['wof:localadmin_id']) {
    return fnNotFound()
  } else if (shpFeature.properties['wof:locality_id']) {
    localities.features.push(shpFeature)
  } else if (shpFeature.properties['wof:localadmin_id']) {
    localadmin.features.push(shpFeature)
  }
  winston.debug(`{ name: "${shpFeature.properties["NOM_COM"]}", locality: ${shpFeature.properties['wof:locality_id']}, localadmin: ${shpFeature.properties['wof:localadmin_id']} }`);
}

const evaluate = (shpFeature) => {
  reproject.parse(shpFeature);
  q.push(() => {
    let p = pointOnFeature(shpFeature).geometry.coordinates;
    return request.getAsync({
      baseUrl: peliasURL,
      url: '/v1/reverse',
      agent: keepAliveAgent,
      qs: { sources: 'wof', 'point.lon': p[0], 'point.lat': p[1], layers: 'locality,localadmin', lang: 'fr' }
    }).then(res => {
      return Promise.map(JSON.parse(res.body).features, updateProperties(shpFeature))
      .then(() => {
        return addFeature(shpFeature, () => {
          return request.getAsync({
            baseUrl: peliasURL,
            url: '/v1/search/structured',
            agent: keepAliveAgent,
            qs: { sources: 'wof', country: 'France', locality: shpFeature.properties.NOM_COM }
          }).then(res => {
            return Promise.filter(JSON.parse(res.body).features, peliasFeature => {
              return utils.areNear(p, pointOnFeature(peliasFeature).geometry.coordinates, 0.2);
            }).map(updateProperties(shpFeature))
            .then(() => {
              return addFeature(shpFeature, () => {
                newlocalities.features.push(shpFeature)
              });
            });
          });
        });
      });
    }).catch(e => {
      winston.error(e);
      process.exit(1);
    });
  })
}
const shp = new ReadShapefile({
  shp: shapefile,
  dbf: dbf,
  evaluate: { fn: evaluate }
});

shp.readAsync().then(() => {
  q.on('end', (err) => {
    if (err) {
      winston.error('An error occured:', e);
    }
    winston.info(`Done in ${(Date.now() - start) / 1000} seconds.`);
    fs.writeFileSync('localities.geojson', JSON.stringify(localities));
    fs.writeFileSync('localadmin.geojson', JSON.stringify(localadmin));
    fs.writeFileSync('localityAndLocaladmin.geojson', JSON.stringify(localityAndLocaladmin));
    fs.writeFileSync('newlocalities.geojson', JSON.stringify(newlocalities));
  })
});