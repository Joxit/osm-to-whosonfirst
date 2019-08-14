const csv = require('csv-stream')
const fs = require('fs')
const through2 = require('through2');

module.exports = (file, cb) => {
  const result = {}
  fs.createReadStream(file).pipe(csv.createStream({
    delimiter: '\t',
    columns: ['country code', 'postal code', 'place name', 'admin name1', 'admin code1', 'admin name2', 'admin code2', 'admin name3', 'admin code3', 'latitude', 'longitude','accuracy']
  })).pipe(through2.obj((row, enc, next) => {
    result[row['postal code']] = result[row['postal code']] || [];
    result[row['postal code']].push(row);
    next()
  })).on('finish', () => cb(result))
}
