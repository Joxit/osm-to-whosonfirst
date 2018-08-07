const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const utils = require('../').utils;
const tmp = require('tmp');
const villetaneuse = JSON.parse(fs.readFileSync('test/resources/whosonfirst-data/data/101/751/173/101751173.geojson'));

describe('Who\'s on first utils', () => {
  it('should get whosonfirst path from id', () => {
    let directory = './test/resources/whosonfirst-data'
    expect(utils.getGeoJSONPath(directory, 101751173)).to.be.equal('test/resources/whosonfirst-data/data/101/751/173/101751173.geojson');
    expect(utils.getGeoJSONPath(directory, 102070993)).to.be.equal('test/resources/whosonfirst-data/data/102/070/993/102070993.geojson');
    expect(utils.getGeoJSONPath(directory, 102191581)).to.be.equal('test/resources/whosonfirst-data/data/102/191/581/102191581.geojson');
  });
  it('should get geojson', done => {
    let directory = './test/resources/whosonfirst-data'
    utils.getGeoJSON(directory, 101751173).then(geojson => {
      expect(geojson).to.be.deep.equal(villetaneuse)
      done();
    }).catch(done);
  });
  it('should create geojson in wof directory', done => {
    let tmpobj = tmp.dirSync({unsafeCleanup: true});
    utils.writeGeoJSON(tmpobj.name, villetaneuse).then(() => {
      return utils.getGeoJSON(tmpobj.name, 101751173).then(geojson => {
        expect(geojson).to.be.deep.equal(villetaneuse);
        tmpobj.removeCallback()
        done();
      });
    }).catch(done);
  });
});

describe('Equals utils', () => {
  it('sould return true when two integer are almost equals', () => {
    expect(utils.equals(10, 10)).to.be.true;
    expect(utils.equals(10, 11, 1)).to.be.true;
    expect(utils.equals(10, 10.25, 0.5)).to.be.true;
  });
  it('sould return true when two integer are not equals', () => {
    expect(utils.equals(10, 11)).to.be.false;
    expect(utils.equals(10, 12, 1)).to.be.false;
    expect(utils.equals(10, 10.5, 0.25)).to.be.false;
  });
})