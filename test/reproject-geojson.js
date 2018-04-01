const expect = require('chai').expect;
const sinon = require('sinon');
const ReprojectGeoJSON = require('../lib/reproject-geojson');
const fs = require('fs')
const EPSG2154Example = () => JSON.parse(fs.readFileSync('./test/resources/EPSG2154.geojson'));
const EPSG4326Example = () => JSON.parse(fs.readFileSync('./test/resources/EPSG4326.geojson'));
const lambert93Proj = '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const WGS84Proj = '+proj=longlat +datum=WGS84 +no_defs';

describe('Reproject GeoJSON', () => {
  it('should get correct projection for 2154', () => {
    expect(ReprojectGeoJSON.getProjection(2154)).to.equals(lambert93Proj);
  });
  it('should get correct projection for EPSG:2154', () => {
    expect(ReprojectGeoJSON.getProjection('EPSG:2154')).to.equals(lambert93Proj);
    expect(ReprojectGeoJSON.getProjection('epsg:2154')).to.equals(lambert93Proj);
    expect(ReprojectGeoJSON.getProjection('EpSg:2154')).to.equals(lambert93Proj);
  });
  it('should reproject coordinates', () => {
    expect(ReprojectGeoJSON.reprojectCoordinates([651176, 6873031], lambert93Proj, WGS84Proj)).to.deep.equals([2.333312950123798, 48.955382335635115]);
    expect(ReprojectGeoJSON.reprojectCoordinates([651229, 6873119], lambert93Proj, WGS84Proj)).to.deep.equals([2.334026491334485, 48.95617765968073]);
    expect(ReprojectGeoJSON.reprojectCoordinates([
      [651176, 6873031],
      [651229, 6873119]
    ], lambert93Proj, WGS84Proj)).to.deep.equals([
      [2.333312950123798, 48.955382335635115],
      [2.334026491334485, 48.95617765968073]
    ]);
  });
  describe('As static function', () => {
    it('should reproject GeoJSON', () => {
      expect(ReprojectGeoJSON.parse(EPSG2154Example(), 'EPSG:2154', 'EPSG:4326')).to.deep.equals(EPSG4326Example());
    });
    it('should alter original GeoJSON object', () => {
      let example = EPSG2154Example();
      expect(ReprojectGeoJSON.parse(example, 'EPSG:2154', 'EPSG:4326')).to.deep.equals(EPSG4326Example());
      expect(example).to.deep.equals(EPSG4326Example());
    });
  });
  describe('As object', () => {
    let reprojectGeoJSON = new ReprojectGeoJSON('EPSG:2154', 'EPSG:4326');
    it('should reproject GeoJSON', () => {
      expect(reprojectGeoJSON.parse(EPSG2154Example())).to.deep.equals(EPSG4326Example());
    });
    it('should alter original GeoJSON object', () => {
      let example = EPSG2154Example();
      expect(reprojectGeoJSON.parse(example)).to.deep.equals(EPSG4326Example());
      expect(example).to.deep.equals(EPSG4326Example());
    });
  });
});