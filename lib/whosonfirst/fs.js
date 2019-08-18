const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const wofIdToPath = require('pelias-whosonfirst/src/wofIdToPath')

module.exports = class WhosonfirstFS {
  constructor({directory, raw = false}) {
    this.directory = path.join(directory, 'data')
    this.raw = raw
  }
  get(id) {
    const content = fs.readFileSync(this.wofIdToPath(id))
    return this.raw ? content : JSON.parse(content)
  }
  getAsync(id) {
    const self = this
    return fs.readFileAsync(this.wofIdToPath(id)).then(content => {
      return self.raw ? content : JSON.parse(content)
    })
  }
  wofIdToPath(id) {
    return path.join(wofIdToPath(id).reduce((acc, part) => {
      return path.join(acc, part)
    }, this.directory), `${id}.geojson`)
  }
}