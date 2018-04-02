const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const WhosonfirstLookup = require('../lib/whosonfirst-lookup');
const villetaneuseLocality = JSON.parse(fs.readFileSync('./test/resources/whosonfirst-data/data/101/751/173/101751173.geojson'));
describe('Who\'s On First lookup', () => {
  it('should load data from directory', done => {
    let wofLookup = new WhosonfirstLookup({directory: './test/resources/whosonfirst-data'});
    wofLookup.load().then(() => {
      expect(wofLookup.features).to.not.be.undefined;
      expect(wofLookup.features['locality']).to.not.be.undefined;
      expect(wofLookup.features['locality']).to.be.lengthOf(1);
      expect(wofLookup.features['localadmin']).to.be.lengthOf(1);
      expect(wofLookup.features['empire']).to.be.undefined;
      done();
    });
  });
  it('should return polygon', (done) => {
    let wofLookup = new WhosonfirstLookup({directory: './test/resources/whosonfirst-data'});
    wofLookup.load().then(() => {
      expect(wofLookup.lookup({
        lat: 48.957372,
        long: 2.345141,
        layer: 'locality'
      })).to.be.deep.equal(villetaneuseLocality)
      done();
    });
  })
});