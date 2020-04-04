import colormap from 'colormap'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import './leafletHelper'
import {
  getMapData,
  getYahooPopulationLog,
} from './data'
import './style.css'
import { isUndefined } from 'util'

const defaultCenter = [35.68, 139.75]
const defaultZoom = 12
const map = L.map('map', {
  zoom: defaultZoom,
  center: defaultCenter,
  zoomControl: false,
})
const attribution = [
  'Tiles <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
  'Boundary Data <a href="https://github.com/niiyz/JapanCityGeoJson/">JapanCityGeoJson</a>',
  'Polulation Log <a href="https://ds.yahoo.co.jp/topics/20200403.html">ヤフー・データソリューション</a>',
  'Visualization &copy; <a href="https://github.com/colspan">@colspan</a>',
].join(' | ')
const basemap = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', { attribution })
basemap.addTo(map)
const titleControl = L.control.title({ title: 'COVID-19 Tokyo Daytime Population Transition', position: 'topleft' }).addTo(map)
L.control.zoom({ position: 'bottomright' }).addTo(map);

Promise.all([
  getMapData(),
  getYahooPopulationLog(),
])
  .then(result => {
    const [mapData, ypLog] = result
    const cityIds = Object.keys(ypLog)
    const dates = ypLog[cityIds[0]].value.date
    // console.log(ypLog, ypLog[cityIds[0]].value.date)

    // calc max, min
    const maxFunc = (a, b) => a > b ? a : b
    const minFunc = (a, b) => a < b ? a : b
    const cityMaxMins = cityIds.map(cid => {
      const cityLog = ypLog[cid]
      const targetKey = '来訪者'
      const max = cityLog.value[targetKey].reduce(maxFunc)
      const min = cityLog.value[targetKey].reduce(minFunc)
      return [max, min]
    })
    const wholeCityMax = cityMaxMins.map(x => x[0]).reduce(maxFunc)

    // state variables
    const logOffset = 7
    let logIndex = 0

    // choropleth map
    const levelColor = colormap({
      colormap: 'RdBu',
      nshades: 30,
      format: 'hex',
      alpha: 1,
    })
    const colMap = L.geoJSON(mapData, {
      style: {
        "color": levelColor[0],
        "weight": 0.1,
        "opacity": 1,
        'fillOpacity': 0.8,
      }
    }).addTo(map);
    function updateChoroplethMap() {
      colMap.setStyle(feature => {
        try {
          const cityId = feature.id
          const [cityMax, cityMin] = cityMaxMins[cityIds.findIndex(d => d === cityId)]
          const currentLog = ypLog[cityId]
          const baseValue = currentLog.value['来訪者'][logIndex % logOffset]
          const currentValue = currentLog.value['来訪者'][logIndex]
          const changeDiff = currentValue - baseValue
          let colorIndex = parseInt((changeDiff / cityMax) * (levelColor.length - 1) + levelColor.length / 2, 10)
          colorIndex = colorIndex < 0 ? 0 : colorIndex
          colorIndex = colorIndex >= levelColor.length ? levelColor.length - 1 : colorIndex
          const color = levelColor[colorIndex]
          return {
            fillColor: color,
            opacity: 1.0,
          }
        }
        catch (e) {
          console.error(e)
          // do nothing
        }
      })
    }

    // indicator
    const mapIndicator = L.control.emptyDiv({ position: 'bottomleft', className: 'map-indicator' })
    const mapIndicatorContainer = mapIndicator.addTo(map)
    /// current time indicator
    const currentTimeContainer = document.createElement('div')
    currentTimeContainer.className = 'datetime'
    mapIndicatorContainer.getContainer().appendChild(currentTimeContainer)
    const timeSliderContainer = document.createElement('input')
    /// time slider
    const fmtOpts = {
      year: 'numeric', month: '2-digit', day: '2-digit',
      weekday: 'short', timeZone: 'Asia/Tokyo',
    };
    const dateFmt = new Intl.DateTimeFormat('ja-JP', fmtOpts);

    timeSliderContainer.className = 'selector'
    timeSliderContainer.type = 'range'
    timeSliderContainer.min = 0
    timeSliderContainer.max = dates.length - 1
    mapIndicatorContainer.getContainer().appendChild(timeSliderContainer)
    function updateIndicator() {
      const current_date = Date.parse(dates[logIndex])
      currentTimeContainer.innerHTML = dateFmt.format(current_date)
      mapIndicatorContainer.value = logIndex
      timeSliderContainer.value = logIndex
    }

    // start animation
    const updateInterval = 500
    let animIntervalObj
    const updateIndex = (newIndex) => {
      if (isUndefined(newIndex)) {
        logIndex += 1
      }
      else {
        logIndex = newIndex
      }
      if (dates.length <= logIndex || logIndex < 0) logIndex = 0
      updateIndicator()
      updateChoroplethMap()
    }
    timeSliderContainer.addEventListener('input', (e) => {
      clearInterval(animIntervalObj)
      map.dragging.disable();
      logIndex = +e.target.value
      updateIndex(logIndex)
    })
    timeSliderContainer.addEventListener('change', () => {
      animIntervalObj = setInterval(updateIndex, updateInterval)
      map.dragging.enable();
    })
    animIntervalObj = setInterval(updateIndex, updateInterval)

  })
  .catch(console.error)
