#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const removeDiacritics = require('diacritics').remove;
const ReadShapefile = require('../').ReadShapefile;
const ReprojectGeoJSON = require('../').ReprojectGeoJSON;
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const pointOnFeature = require('@turf/point-on-feature');
const utils = require('../').utils;
const winston = require('../').winston;
const queue = require('queue');
const features = [];
const q = queue({
  concurrency: 50,
  autostart: true
});
const v8 = require('v8');
v8.setFlagsFromString('--max_old_space_size=4096');
const start = Date.now();
const shapefile = process.argv[2];
const peliasURL = process.argv[3];
if (!peliasURL) {
  console.error(`Arg missing. Usage : ${process.argv[1]} shapefile pelias-url`);
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

let reproject;
function clean(name) {
  return removeDiacritics(name.toLowerCase().replace(/-/g, ' ').replace('st.', 'saint').replace('ste.', 'sainte'))
}

function updateProperties(shpFeature) {
  return (peliasFeature) => {
    if (peliasFeature.properties.localadmin && clean(peliasFeature.properties.localadmin) == clean(shpFeature.properties.NOM_COM)) {
      let gid = peliasFeature.properties.localadmin_gid.split(':')[2];
      if (shpFeature.properties['wof:localadmin_id'] && gid != shpFeature.properties['wof:localadmin_id']) {
        winston.warn(`Duplicates { name: "${shpFeature.properties.NOM_COM}", id1: ${gid}, id2: ${shpFeature.properties['wof:localadmin_id']}, type: "localadmin" }`);
      } else {
        shpFeature.properties['wof:localadmin_id'] = gid;
      }
    }
    if (peliasFeature.properties.locality && clean(peliasFeature.properties.locality) == clean(shpFeature.properties.NOM_COM)) {
      let gid = peliasFeature.properties.locality_gid.split(':')[2]
      if (shpFeature.properties['wof:locality_id'] && gid != shpFeature.properties['wof:locality_id']) {
        winston.warn(`Duplicates { name: "${shpFeature.properties.NOM_COM}", id1: ${gid}, id2: ${shpFeature.properties['wof:locality_id']}, type: "locality" }`);
      } else {
        shpFeature.properties['wof:locality_id'] = gid;
      }
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
    // const keepAliveAgent = new http.Agent({ keepAlive: true });
    let p = pointOnFeature(shpFeature).geometry.coordinates;
    return request.getAsync({
      baseUrl: peliasURL,
      url: '/v1/reverse',
      forever: true,
      qs: { sources: 'wof', 'point.lon': p[0], 'point.lat': p[1], layers: 'locality,localadmin', lang: 'fr' }
    }).then(res => {
      return Promise.map(JSON.parse(res.body).features, updateProperties(shpFeature))
        .then(() => {
          return request.getAsync({
            baseUrl: peliasURL,
            url: '/v1/search/structured',
            forever: true,
            qs: { sources: 'wof', country: 'France', locality: shpFeature.properties.NOM_COM }
          }).then(res => {
            return Promise.filter(JSON.parse(res.body).features, peliasFeature => {
                return utils.areNear(p, pointOnFeature(peliasFeature).geometry.coordinates, 0.2);
              }).map(updateProperties(shpFeature))
              .then(() => {
                return addFeature(shpFeature, () => {
                  newlocalities.features.push(shpFeature)
                  winston.debug(`Not Found: { name: "${shpFeature.properties["NOM_COM"]}" }`);
                });
              });
          });
        });
    }).catch(e => {
      winston.error('An error occured in evaluate:', e);
      process.exit(1);
    });
  })
}
const shp = new ReadShapefile({
  shp: shapefile,
  evaluate: { fn: evaluate }
});

reproject = new ReprojectGeoJSON(fs.readFileSync(shp.getProjPath(), 'utf-8'), 4326)

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
}).catch(e => {
  winston.error('Shapefile read error', e);
});