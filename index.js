module.exports = {
  ReadShapefile: require('./lib/read-shapefile'),
  ReprojectGeoJSON: require('./lib/reproject-geojson'),
  utils: require('./lib/utils'),
  winston: require('./lib/logger'),
  geonamesToJSON: require('./lib/geonames-to-json'),
  whosonfirst: {
    Lookup: require('./lib/whosonfirst/lookup'),
    stream: require('./lib/whosonfirst/stream'),
    Crawl: require('./lib/whosonfirst/crawl'),
    FS: require('./lib/whosonfirst/fs'),
  },
  client: {
    WofPipServerClient: require('./lib/client/wof-pip-server')
  },
  geojson: {
    coords: require('./lib/geojson/coords'),
    polygons: require('./lib/geojson/polygons')
  }
};