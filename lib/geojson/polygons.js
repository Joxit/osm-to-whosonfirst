const coords = require('./coords')
const turf = {
  union: require('@turf/union').default,
  area: require('@turf/area').default
}

function _union(geojsons) {
  if (geojsons.length === 0) return coordsToPolygon([])
  if (geojsons.length === 1) return geojsons[0]
  return geojsons.reduce((acc, geojson, index) => {
    if (index === 0) return acc
    return turf.union(acc, geojson)
  }, geojsons[0])
}

function union(geojsons) {
  if (geojsons instanceof Array) geojsons = _union(geojsons)
  const coordinates = coords
    .flattenPolygons(geojsons)
    .map(c => {
      const polygon = coordsToPolygon([c])
      const area = turf.area(polygon)
      return {c, area}
    })
    .sort((a, b) => b.area - a.area)
    .map(elt => elt.c)

  coordinates.filter(c => coords.clockwise(c)).forEach(c => c.reverse())

  return coordsToMultiPolygon(coordinates.reduce((acc, c) => {
    const outer = acc.find(ring => coords.contains(ring, c))
    if (outer) {
      c.reverse()
      outer.push(c)
    } else {
      acc.push([c])
    }
    return acc
  }, []))
}

function coordsToPolygon(coords) {
  return { type: 'Polygon', coordinates: coords }
}

function coordsToMultiPolygon(coords) {
  return { type: 'MultiPolygon', coordinates: coords }
}

module.exports = {
  union,
  coordsToPolygon,
  coordsToMultiPolygon
}