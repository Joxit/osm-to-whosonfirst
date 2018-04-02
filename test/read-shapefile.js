const expect = require('chai').expect;
const sinon = require('sinon');
const ReadShapefile = require('../lib/read-shapefile');
const fs = require('fs');
const EPSG2154Example = () => JSON.parse(fs.readFileSync('./test/resources/EPSG2154.geojson'));

describe('Read shapefile', () => {
  describe('get props', () => {
    it('should get props', () => {
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp'
      });
      let example = EPSG2154Example();
      expect(readShapefile._getProps(example.properties)).to.deep.equal({
        "first-key": "first-props value",
        "second-key": "second-props value",
        "third-key": "third-props value"
      });
      expect(readShapefile._getProps(example.properties)).to.deep.equal(EPSG2154Example().properties);
    });
    it('should delete props and alter original object with filter.delete', () => {
      let filter = {
        delete: ['first-key', 'third-key']
      };
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp'
      });
      let example = EPSG2154Example();
      expect(readShapefile._getProps(example.properties, filter)).to.deep.equal({
        "second-key": "second-props value"
      });
      expect(readShapefile._getProps(example.properties, filter)).to.deep.equal({
        "second-key": "second-props value"
      });
    });
    it('should keep props and alter original object with filter.keep', () => {
      let filter = {
        keep: ['first-key', 'third-key']
      };
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp'
      });
      let example = EPSG2154Example();
      expect(readShapefile._getProps(example.properties, filter)).to.deep.equal({
        "first-key": "first-props value",
        "third-key": "third-props value"
      });
      expect(readShapefile._getProps(example.properties, filter)).to.deep.equal({
        "first-key": "first-props value",
        "third-key": "third-props value"
      });
    });
  });
  describe('default add geoJSON', () => {
    it('should delete props and alter original object with filter.delete', (done) => {
      let evaluate = {
        filter: {
          delete: ['first-key', 'third-key']
        }
      };
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp'
      });
      let example = EPSG2154Example();
      let expected = EPSG2154Example();
      expected.properties = {
        "second-key": "second-props value"
      }
      readShapefile._defaultAddGeoJSON(evaluate)(example).then(r => {
        expect(r).to.deep.equal([expected]);
        expect(r).to.deep.equal([expected]);
        done();
      })
    });
    it('should keep props and alter original object with filter.keep', (done) => {
      let evaluate = {
        filter: {
          keep: ['first-key', 'third-key']
        }
      };
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp'
      });
      let example = EPSG2154Example();
      let expected = EPSG2154Example();
      expected.properties = {
        "first-key": "first-props value",
        "third-key": "third-props value"
      }
      readShapefile._defaultAddGeoJSON(evaluate)(example).then(r => {
        expect(r).to.deep.equal([expected]);
        expect(r).to.deep.equal([expected]);
        done();
      })
    });
  });
  describe('read shapefile async', () => {
    it('should delete props and alter original object with filter.delete', (done) => {
      let evaluate = {
        filter: {
          delete: ['first-key', 'third-key']
        }
      };
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp',
        dbf: './test/resources/shapefiles/EPSG2154.dbf',
        evaluate: evaluate
      });
      let example = EPSG2154Example();
      let expected = EPSG2154Example();
      expected.properties = {
        "second-key": "second-props value"
      }
      readShapefile.readAsync().then(r => {
        expect(r).to.deep.equal([expected]);
        expect(r).to.deep.equal([expected]);
        done();
      })
    });
    it('should keep props and alter original object with filter.keep', (done) => {
      let evaluate = {
        filter: {
          keep: ['first-key', 'third-key']
        }
      };
      let readShapefile = new ReadShapefile({
        shp: './test/resources/shapefiles/EPSG2154.shp',
        dbf: './test/resources/shapefiles/EPSG2154.dbf',
        evaluate: evaluate
      });
      let example = EPSG2154Example();
      let expected = EPSG2154Example();
      expected.properties = {
        "first-key": "first-props value",
        "third-key": "third-props value"
      }
      readShapefile.readAsync().then(r => {
        expect(r).to.deep.equal([expected]);
        expect(r).to.deep.equal([expected]);
        done();
      })
    });
    describe('should return Promise', () => {
      it('by default', () => {
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
      it('with evaluate function that returns object/undefined', () => {
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
          evaluate: () => { return undefined; }
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
      it('with evaluate function that returns Promise', () => {
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
          evaluate: () => { return Promise.resolve(); }
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
      it('with evaluate function that returns bluebird Promise', () => {
        let Bluebird = require('bluebird');
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
          evaluate: () => { return Bluebird.resolve(); }
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
      it('with evaluate.fn function that returns object/undefined', () => {
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
          evaluate: {fn: () => { return undefined; }}
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
      it('with evaluate.fn function that returns Promise', () => {
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
          evaluate: {fn: () => { return Promise.resolve(); }}
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
      it('with evaluate.fn function that returns bluebird Promise', () => {
        let Bluebird = require('bluebird');
        let readShapefile = new ReadShapefile({
          shp: './test/resources/shapefiles/EPSG2154.shp',
          dbf: './test/resources/shapefiles/EPSG2154.dbf',
          evaluate: {fn: () => { return Bluebird.resolve(); }}
        });
        expect(readShapefile.readAsync()).to.be.instanceof(Promise);
      });
    })
  });
});