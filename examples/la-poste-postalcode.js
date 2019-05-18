#!/usr/bin/env node

// Data from https://datanova.laposte.fr/explore/dataset/laposte_hexasmal/download/?format=geojson&timezone=Europe/Berlin

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const request = Promise.promisifyAll(require('request'));
const path = require('path');
const removeDiacritics = require('diacritics').remove;
const cleanName = require('../').utils.cleanName;
const geojsonPath = process.argv[2];
const peliasURL = process.argv[3];

if (!peliasURL) {
  console.error(`Arg missing. Usage : ${process.argv[1]} geojson pelias-url`);
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'))
const postalcodes = {};
geojson.features.forEach(feature => {
  postalcodes[feature.properties.code_postal] = postalcodes[feature.properties.code_postal] || {};
  postalcodes[feature.properties.code_postal].communes = postalcodes[feature.properties.code_postal].communes || []
  postalcodes[feature.properties.code_postal].communes.push(feature.properties.nom_de_la_commune);
  postalcodes[feature.properties.code_postal].code = feature.properties.code_postal;
})
console.log(Object.keys(postalcodes).length);
Promise.mapSeries(Object.keys(postalcodes), postalcode => {
  /*
  { type: 'Feature',
  geometry:
   { type: 'Point',
     coordinates: [ -0.253157457726, 43.0890909736 ] },
  properties:
   { nom_de_la_commune: 'ARTHEZ D ASSON',
     libell_d_acheminement: 'ARTHEZ D ASSON',
     code_postal: '64800',
     coordonnees_gps: [ 43.0890909736, -0.253157457726 ],
     code_commune_insee: '64058' } }
  */
    return request.getAsync({
      baseUrl: peliasURL,
      url: '/v1/search/structured',
      forever: true,
      qs: { sources: 'wof', country: 'France', postalcode: postalcode }
    })
    .then(res => JSON.parse(res.body).features)
    .then(features => {
      console.error(features)
      if (features.length > 0) {
        let peliasLocaladmin = features[0].properties.localadmin || '';
        let peliasLocality = features[0].properties.locality || '';
        if (peliasLocality.length == 0 && peliasLocaladmin.length == 0) {
          return console.log(JSON.stringify(postalcodes[postalcode]))
        }
        peliasLocality = peliasLocality.length == 0 ? '' : cleanName(peliasLocality);
        peliasLocaladmin = peliasLocaladmin.length == 0 ? '' : cleanName(peliasLocaladmin);
        if (!postalcodes[postalcode].communes.some(e => cleanName(e) == peliasLocality || cleanName(e) == peliasLocaladmin)) {
          postalcodes[postalcode].pelias = features[0];
          console.log(JSON.stringify(postalcodes[postalcode]))
          return postalcodes[postalcode];
        }
      }
    })
})