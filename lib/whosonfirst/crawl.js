const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const Readable = require('stream').Readable;
const path = require('path')
const WOF_FILE = /^[0-9]+.geojson$/

module.exports = class WOFCrawl extends Readable {
  constructor({directory}) {
    super({ objectMode: true, autoDestroy: true, highWaterMark: 32 });
    this.directory = path.join(directory, 'data')
    this._cur = this.directory
    this._iterator = []
    setTimeout(this._fill.bind(this), 0)
  }
  _read() {
    const self = this;
    var ok = true;
    var elt;
    do {
      elt = this._iterator.pop();
      if (elt) { ok = this.push(elt); }
      else if (this.done && this._iterator.length === 0) { this.push(null); break; }
    } while(ok && elt)
  }
  _fill() {
    const self = this
    this._fillRec(this._cur)
    // console.log('fill')
    this.done = true
  }
  _fillRec(directory) {
    const self = this
    // console.log("rec")
    fs.readdirSync(directory).map(f => {
      return { f, stat: fs.statSync(path.join(directory, f)) }
    }).map(({ f, stat } )=> {
      if (stat.isFile()) {
        if (WOF_FILE.test(path.basename(f))) self._add(path.join(directory, f))
      } else {
        self._fillRec(path.join(directory, f))
      }
    })
  }
  _add(elt) {
    this._iterator.push(elt)
    if(!this._readableState.paused) {
      this.push(this._iterator.pop());
    }
  }
}