#!/usr/bin/env node

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const pointOnFeature = require('@turf/point-on-feature');
const winston = require('../').winston;
const request = Promise.promisifyAll(require('request'));
const http = Promise.promisifyAll(require('http'));
const keepAliveAgent = new http.Agent({ keepAlive: true });
const utils = require('../').utils;
const removeDiacritics = require('diacritics').remove;

// Geojson from admin-express, this is a FeatureCollection with all localities.
// Ou can use outputs from admin-express-pelias
const geojson = process.argv[2];
// Path of wof data to get ids
const wofPath = process.argv[3];
// Pelias URL for check requests
const peliasURL = process.argv[4];

function getFeatureCollection(name) {
  return {
    "type": "FeatureCollection",
    "name": name,
    "features": []
  };
}

function clean(name) {
  return removeDiacritics(name.toLowerCase().replace(/-/g, ' ').replace('st.', 'saint').replace('ste.', 'sainte'))
}

fs.readFileAsync(geojson).then(file => {
  // Add pointOnFeature for all localities and sort by name
  let localities = JSON.parse(file).features.map(f => {
    f.properties.pointOnFeature = pointOnFeature(f).geometry.coordinates;
    return f;
  }).sort((a, b) => {
    if (a.properties.NOM_COM < b.properties.NOM_COM) {
      return -1;
    } else if (a.properties.NOM_COM == b.properties.NOM_COM) {
      return 0;
    } else return 1
  });
  return Promise.mapSeries(localities, e => {
    const featureCollection = getFeatureCollection(e.properties.NOM_COM);
    featureCollection.features.push(e)
    const p1 = e.properties.pointOnFeature;
    return request.getAsync({
      baseUrl: peliasURL,
      url: '/v1/search/structured',
      agent: keepAliveAgent,
      qs: { sources: 'wof', country: 'France', locality: e.properties.NOM_COM }
      // url: '/v1/reverse',
      // agent: keepAliveAgent,
      // qs: { sources: 'wof', 'point.lon': p1[0], 'point.lat': p1[1], layers: 'locality,localadmin', lang: 'fr' }
    }).then(res => {
      winston.debug(`Received: ${e.properties.NOM_COM}`)
      return Promise.filter(JSON.parse(res.body).features, f => {
        return utils.areNear(p1, pointOnFeature(f).geometry.coordinates, 0.2);
      }).map(f => {
        const res = [];
        if (f.properties.localadmin && clean(f.properties.localadmin) == clean(e.properties.NOM_COM)) {
          res.push(utils.getGeoJSON(wofPath, f.properties.localadmin_gid.split(':')[2]))
        }
        if (f.properties.locality && clean(f.properties.locality) == clean(e.properties.NOM_COM)) {
          res.push(utils.getGeoJSON(wofPath, f.properties.locality_gid.split(':')[2]))
        }
        return Promise.map(res, f => {
          featureCollection.features.push(f);
          return f;
        });
      }).then(features => {
        if (featureCollection.features.length > 1) {
          winston.debug(e.properties.NOM_COM)
        }
        return featureCollection;
      });
    }).catch(e => {
      winston.error(e);
      process.exit(1);
    })
  }).then(res => {
    // Array of features collection. Each element is a feature collection with admin-express geojson + wof
    return fs.writeFileSync('admin-express-check-output.json', JSON.stringify(res));
  });
});