const expect = require('chai').expect;
const sinon = require('sinon');
const geojson = require('../../').geojson
const fs = require('fs')
const villetaneuse = fs.readFileSync('./test/resources/whosonfirst-data/data/101/751/173/101751173.geojson')
const pierrefite = fs.readFileSync('./test/resources/whosonfirst-data/data/102/070/993/102070993.geojson')
const france = fs.readFileSync('./test/resources/whosonfirst-data/data/856/331/47/85633147.geojson')
const idf = fs.readFileSync('./test/resources/whosonfirst-data/data/404/227/465/404227465.geojson')

describe('GeoJSON coords', () => {
  describe('isValidPolygon', () => {
    it('should be valid for Villetaneuse', () => {
      expect(geojson.coords.isValidPolygon(JSON.parse(villetaneuse).geometry.coordinates)).to.be.true
    })
    it('should be valid for Pierrefite', () => {
      expect(geojson.coords.isValidPolygon(JSON.parse(pierrefite).geometry.coordinates)).to.be.true
    })
    it('should not be invalid for France', () => {
      expect(geojson.coords.isValidPolygon(JSON.parse(france).geometry.coordinates)).to.be.false
    })
  })

  describe('isValidMultiPolygon', () => {
    it('should be invalid for Villetaneuse', () => {
      expect(geojson.coords.isValidMultiPolygon(JSON.parse(villetaneuse).geometry.coordinates)).to.be.false
    })
    it('should be invalid for Pierrefite', () => {
      expect(geojson.coords.isValidMultiPolygon(JSON.parse(pierrefite).geometry.coordinates)).to.be.false
    })
    it('should not be valid for France', () => {
      expect(geojson.coords.isValidMultiPolygon(JSON.parse(france).geometry.coordinates)).to.be.true
    })
  })

  describe('pointInPolygon', () => {
    it('Villetaneuse points should be in France', () => {
      geojson.coords.flattenCoordinates(JSON.parse(villetaneuse)).forEach(c => {
        expect(geojson.coords.pointInPolygon(c, JSON.parse(france).geometry.coordinates)).to.be.true
      })
    })
    it('Pierrefite points should be in France', () => {
      geojson.coords.flattenCoordinates(JSON.parse(pierrefite)).forEach(c => {
        expect(geojson.coords.pointInPolygon(c, JSON.parse(france).geometry.coordinates)).to.be.true
      })
    })
    it('Villetaneuse points should be in Ile De France', () => {
      geojson.coords.flattenCoordinates(JSON.parse(villetaneuse)).forEach(c => {
        expect(geojson.coords.pointInPolygon(c, JSON.parse(idf).geometry.coordinates)).to.be.true
      })
    })
    it('France points should not be in Villetaneuse', () => {
      geojson.coords.flattenCoordinates(JSON.parse(france)).forEach(c => {
        expect(geojson.coords.pointInPolygon(c, JSON.parse(villetaneuse).geometry.coordinates)).to.be.false
      })
    })
  })

  describe('contains', () => {
    it('France should contains Villetaneuse', () => {
      expect(geojson.coords.contains(JSON.parse(france).geometry.coordinates, JSON.parse(villetaneuse).geometry.coordinates)).to.be.true
    })
    it('Pierrefite should not contains Villetaneuse', () => {
      expect(geojson.coords.contains(JSON.parse(pierrefite).geometry.coordinates, JSON.parse(villetaneuse).geometry.coordinates)).to.be.false
    })
    it('Ile De France should contains Villetaneuse', () => {
      expect(geojson.coords.contains(JSON.parse(idf).geometry.coordinates, JSON.parse(villetaneuse).geometry.coordinates)).to.be.true
    })
    it('Villetaneuse should not contains France', () => {
      expect(geojson.coords.contains(JSON.parse(villetaneuse).geometry.coordinates, JSON.parse(france).geometry.coordinates)).to.be.false
    })
  })

  describe('flattenPolygons', () => {
    it('should not change Polygons coordinates', () => {
      expect(geojson.coords.flattenPolygons(JSON.parse(villetaneuse))).to.deep.equal(JSON.parse(villetaneuse).geometry.coordinates)
    })
    it('should change MultiPolygons coordinates', () => {
      geojson.coords.flattenPolygons(JSON.parse(france)).forEach(c => {
        c.forEach(c => {
          expect(c[0]).to.be.a('number')
          expect(c[1]).to.be.a('number')
        })
      })
    })
    it('should flatten empty polygons', () => {
      const actual = geojson.coords.flattenPolygons(geojson.polygons.coordsToPolygon([]))
      expect(actual).to.not.be.undefined
      expect(actual).to.be.a('array')
    })
  })

  describe('clockwise', () => {
    it('Polygons coordinates should be clockwise', () => {
      expect(geojson.coords.clockwise(JSON.parse(villetaneuse).geometry.coordinates[0])).to.be.true
    })
    it('MultiPolygons coordinates should not all be clockwise', () => {
      geojson.coords.flattenPolygons(JSON.parse(france)).forEach((c, index, coords) => {
        if (index < coords.length - 1) expect(geojson.coords.clockwise(c)).to.be.true
        if (index === coords.length - 1) expect(geojson.coords.clockwise(c)).to.be.false
      })
    })
  })
})
