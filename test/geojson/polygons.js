const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs')
const geojson = require('../../').geojson
const morimondo = fs.readFileSync('./test/resources/whosonfirst-data/data/404/468/461/404468461.geojson')
const abbiategrasso = fs.readFileSync('./test/resources/whosonfirst-data/data/404/468/291/404468291.geojson')
const cassinetta = fs.readFileSync('./test/resources/whosonfirst-data/data/404/468/363/404468363.geojson')
const cap20081 = fs.readFileSync('./test/resources/whosonfirst-data/data/504/787/283/504787283.geojson')

const villetaneuse = fs.readFileSync('./test/resources/whosonfirst-data/data/101/751/173/101751173.geojson')
const idf = fs.readFileSync('./test/resources/whosonfirst-data/data/404/227/465/404227465.geojson')
const france = fs.readFileSync('./test/resources/whosonfirst-data/data/856/331/47/85633147.geojson')

describe('polygons', () => {
  describe('union', () => {
    it('should get the correct MultiPolygon for CAP 20081 italy', () => {
      const actual = geojson.polygons.union([JSON.parse(morimondo), JSON.parse(abbiategrasso), JSON.parse(cassinetta)])
      expect(actual.coordinates).to.be.a('array')
      expect(actual.coordinates).to.be.not.empty
      expect(actual).to.deep.equal(JSON.parse(cap20081).geometry)
    })
    it('should get the correct MultiPolygon for Villetaneuse/Ile-De-France/France', () => {
      const polygon = JSON.parse(france);
      polygon.geometry.coordinates.push(JSON.parse(villetaneuse).geometry.coordinates)
      polygon.geometry.coordinates.push(JSON.parse(idf).geometry.coordinates)
      const actual = geojson.polygons.union(polygon)
      fs.writeFileSync('test.geojson', JSON.stringify(actual))
      expect(actual.coordinates).to.be.a('array')
      expect(actual.coordinates).to.be.not.empty
      expect(actual.coordinates.length).to.be.equals(21)
      expect(actual.coordinates[0].length).to.be.equals(3)
    })
  })
})