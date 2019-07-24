#!/usr/bin/env node

const fs = require('fs')
const whosonfirst = require('pelias-whosonfirst')
const through2 = require('through2');
const sink = require('through2-sink');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const csvWriterStream = require('csv-write-stream')
const queue = require('queue');
const q = queue({
  concurrency: 50,
  autostart: true
});

const database = process.argv[2]
const baseUrl = 'http://127.0.0.1:3000'

const SQL_STATEMENT = `SELECT placetype,id,name,latitude,longitude
FROM spr
WHERE placetype IN ('locality', 'localadmin')
AND id != 1 AND is_deprecated = 0 AND is_superseded = 0
AND NOT TRIM( IFNULL(name, '') ) = ''
AND NOT (latitude = 0 AND longitude = 0)`

const writer = csvWriterStream();
writer.pipe(fs.createWriteStream('out.csv'))
new whosonfirst.SQLiteStream(database, SQL_STATEMENT).pipe(through2.obj((data,enc,next) => {
  request.getAsync({
    baseUrl: baseUrl,
    url: '/query/pip',
    forever: true,
    qs: { 'lon': data.longitude, 'lat': data.latitude, lang: 'fr' }
  })
  .then(pip => {
    const postalcode = JSON.parse(pip.body).find(e => e.source=== 'wof' && e.type === 'postalcode')
    if (!postalcode) { return Promise.resolve(next()); }
    return request.getAsync({
      baseUrl: baseUrl,
      url: `/place/wof/${postalcode.id}/property`
    })
      .then(property => JSON.parse(property.body))
      .filter(property => property.key === 'name')
      .then(property => {  if (property[0]) postalcode.name = property[0].value } )
      .then(() => next(null, {locality: data, postalcode}))
  })
})).pipe(through2.obj(({locality, postalcode}, enc, next) => {
  if(locality && postalcode) {
    return next(null, {
      locality_id: `whosonfirst:${locality.placetype}:${locality.id}`,
      postalcodes: JSON.stringify([postalcode.name]),
      postalcodes_id: JSON.stringify([postalcode.id]),
      locality_name: locality.name
    })
  }
  next()
}))
.pipe(writer)
.on('finish', () => {
  console.log('done')
})


