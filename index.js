module.exports = {
  ReadShapefile: require('./lib/read-shapefile'),
  ReprojectGeoJSON: require('./lib/reproject-geojson'),
  utils: require('./lib/utils'),
  WhosonfirstLookup: require('./lib/whosonfirst-lookup'),
  whosonfirstStream: require('./lib/whosonfirst-stream'),
  WhosonfirstCrawl: require('./lib/whosonfirst-crawl'),
  winston: require('./lib/logger'),
  geonamesToJSON: require('./lib/geonames-to-json'),
  client: {
    WofPipServerClient: require('./lib/client/wof-pip-server')
  },
  geojson: {
    coords: require('./lib/geojson/coords'),
    polygons: require('./lib/geojson/polygons')
  }
};