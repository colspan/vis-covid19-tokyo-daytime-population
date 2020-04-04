import L from 'leaflet'

/* NOTE: This code is needed to properly load the images in the Leaflet CSS */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})
L.Control.Title = L.Control.extend({
  onAdd: function (map) {
    const div = L.DomUtil.create('div')
    div.className = 'map-title'
    div.innerHTML = `<h1>${this.options.title}</h1>`
    return div
  },
  onRemove: function (map) {
    // Nothing to do here
  }
})
L.control.title = function (opts) {
  return new L.Control.Title(opts)
}

L.Control.EmptyDiv = L.Control.extend({
  onAdd: function (map) {
    const div = L.DomUtil.create('div')
    div.className = this.options.className;
    return div
  },
  onRemove: function (map) {
    // Nothing to do here
  }
})
L.control.emptyDiv = function (opts) {
  return new L.Control.EmptyDiv(opts)
}
