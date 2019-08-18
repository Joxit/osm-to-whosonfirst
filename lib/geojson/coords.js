
function _isValidPolygon(coords) {
  return coords.length > 3 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
}

function isValidPolygon(coords) {
  return coords[0].length > 3 && coords.every(_isValidPolygon)
}

function isValidMultiPolygon(coords) {
  return coords.every(isValidPolygon)
}

function inRing(c, outer) {
    let isInside = false;

    for (let i = 0, j = outer.length - 2; i < outer.length - 1; j = i++) {
        const onBoundary = (c[1] * (outer[i][0] - outer[j][0]) + outer[i][1] * (outer[j][0] - c[0]) + outer[j][1] * (c[0] - outer[i][0]) === 0)
          && ((outer[i][0] - c[0]) * (outer[j][0] - c[0]) <= 0)
          && ((outer[i][1] - c[1]) * (outer[j][1] - c[1]) <= 0);
        if (onBoundary) {
            return false;
        }
        const intersect = ((outer[i][1] > c[1]) !== (outer[j][1] > c[1]))
          && (c[0] < (outer[j][0] - outer[i][0]) * (c[1] - outer[i][1]) / (outer[j][1] - outer[i][1]) + outer[i][0]);
        if (intersect) {
            isInside = !isInside;
        }
    }
    return isInside;
}

function pointInPolygon(c, polys) {
  let insidePoly = false;
  if (typeof polys[0][0][0] === 'number') polys = [polys]
  for (let i = 0; i < polys.length && !insidePoly; i++) {
    if (inRing(c, polys[i][0])) {
      let inHole = false;
      let k = 1;
      while (k < polys[i].length && !inHole) {
          if (inRing(c, polys[i][k])) {
              inHole = true;
          }
          k++;
      }
      if (!inHole) {
          insidePoly = true;
      }
    }
  }
  return insidePoly
}

function contains(outer, inner) {
  return !flattenCoordinates(inner).some(c => !pointInPolygon(c, outer))
}

function flattenCoordinates(o) {
  if (o.geometry && o.geometry.coordinates) {
    o = o.geometry.coordinates
  }
  if (o instanceof Array) {
    if (typeof o[0][0] === 'number') return o
    return o.reduce((acc, c) => acc.concat(flattenCoordinates(c)), [])
  }
}

function flattenPolygons(o) {
  if (o.coordinates){
    o = o.coordinates
  } else if (o.geometry && o.geometry.coordinates) {
    o = o.geometry.coordinates
  }
  if (o instanceof Array) {
    if (o.length === 0) return []
    if (typeof o[0][0][0] === 'number') return o.filter(c => _isValidPolygon(c))
    return o.reduce((acc, c) => acc.concat(flattenPolygons(c)), [])
  }
}

function clockwise(coords) {
  return coords.reduce((acc, c, index) => {
    let next = coords[index + 1]
    if (!next) return acc
    return acc + ((next[0] - c[0]) * (next[1] + c[1]))
  }, 0) > 0
}

module.exports = {
  isValidPolygon,
  isValidMultiPolygon,
  contains,
  pointInPolygon,
  flattenCoordinates,
  flattenPolygons,
  clockwise
}