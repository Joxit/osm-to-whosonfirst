const filter = require('through2-filter');
const whosonfirst = require('pelias-whosonfirst');
const extractFields = require('pelias-wof-admin-lookup/src/pip/components/extractFields');
const filterOutCitylessNeighbourhoods = require('pelias-wof-admin-lookup/src/pip/components/filterOutCitylessNeighbourhoods');
const filterOutHierarchylessNeighbourhoods = require('pelias-wof-admin-lookup/src/pip/components/filterOutHierarchylessNeighbourhoods');
const filterOutPointRecords = require('pelias-wof-admin-lookup/src/pip/components/filterOutPointRecords');

function readData({datapath, layer, country}) {
  return whosonfirst.metadataStream(datapath).create(layer)
    .pipe(whosonfirst.parseMetaFiles())
    .pipe(whosonfirst.isNotNullIslandRelated())
    .pipe(whosonfirst.recordHasName())
    .pipe(filter.obj(wofData => {
      return wofData.iso_country == country;
    }))
    .pipe(whosonfirst.loadJSON(datapath, false))
    .pipe(whosonfirst.recordHasIdAndProperties())
    .pipe(whosonfirst.isActiveRecord())
    .pipe(filterOutPointRecords.create())
    .pipe(filterOutHierarchylessNeighbourhoods.create())
    .pipe(filterOutCitylessNeighbourhoods.create());
}

module.exports = readData;