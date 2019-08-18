const expect = require('chai').expect;
const sinon = require('sinon');
const WhosonfirstLookup = require('../').whosonfirst.Lookup;

describe('Who\'s On First lookup', () => {
  it('should load data from directory', done => {
    let wofLookup = new WhosonfirstLookup({ directory: './test/resources/whosonfirst-data' });
    wofLookup.load().then(() => {
      expect(wofLookup.pipService).to.not.be.undefined;
      done();
    }).catch(done).finally(() => {
      wofLookup.pipService.end();
    });
  });
  it('should return polygon', (done) => {
    let wofLookup = new WhosonfirstLookup({ directory: './test/resources/whosonfirst-data' });
    wofLookup.load().then(() => {
      return wofLookup.lookup({
        lat: 48.957372,
        long: 2.345141,
        layers: ['locality']
      });
    }).then(r => {
      expect(r[0].Id).to.be.equal(101751173)
      done();
    }).catch(done).finally(() => {
      wofLookup.pipService.end();
    });
  });
});