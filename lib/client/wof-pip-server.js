/*
 * This client is for a use with wof-pip-server => https://github.com/whosonfirst/go-whosonfirst-pip-v2
 * cmd : wof-pip-server -enable-geojson -mode directory .
 */

const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

module.exports = class WofPipServerClient {
  constructor({baseUrl = 'http://127.0.0.1:8080', placetype, geometry = true, raw = false}) {
    this.baseUrl = baseUrl
    this.placetype = placetype
    this.geometry = geometry
    this.raw = raw
  }
  getAsync({lat, lng}) {
    const self = this
    return request.getAsync({
      baseUrl: this.baseUrl,
      url: '/',
      forever: true,
      qs: {
        latitude: lat,
        longitude: lng,
        placetype: this.placetype,
        format: this.geometry ? 'geojson' : undefined }
    }).then(result => {
      const body = JSON.parse(result.body)
      return self.raw ? body : (self.geometry ? body.features : body.places);
    })
  }
}