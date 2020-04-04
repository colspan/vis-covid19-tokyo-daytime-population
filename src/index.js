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
  'Tiles &copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
  'Polulation Log &copy; <a href="https://ds.yahoo.co.jp/topics/20200403.html">ヤフー・データソリューション</a>',
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
    const city_ids = Object.keys(ypLog)
    const dates = ypLog[city_ids[0]].value.date
    console.log(ypLog, ypLog[city_ids[0]].value.date)


    // calc max, min
    const maxFunc = (a, b) => a > b ? a : b
    const minFunc = (a, b) => a < b ? a : b
    const cityMaxMins = city_ids.map(cid => {
      const cityLog = ypLog[cid]
      const targetKey = '来訪者'
      const max = cityLog.value[targetKey].reduce(maxFunc)
      const min = cityLog.value[targetKey].reduce(minFunc)
      return [max, min]
    })
    const wholeCityMax = cityMaxMins.map(x => x[0]).reduce(maxFunc)

    // state variables
    let logIndex = 0
    const levelColor = colormap({
      colormap: 'portland',
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
          const city_id = feature.id
          const current_log = ypLog[city_id]
          const current_value = current_log.value['来訪者'][logIndex]
          const color = levelColor[parseInt((current_value) / wholeCityMax * (levelColor.length - 1), 10)]
          return {
            fillColor: color,
            opacity: 1.0,
          }
        }
        catch (e) {
          // do nothing
        }
      })
    }

    // // markers
    // const siteInfoMarkers = riverSiteInfo.map(d => {
    //   const marker = L.circleMarker(d.coordinate, {
    //     weight: 1,
    //   }).addTo(map)
    //   const text = `${d.site_name}`
    //   marker.bindTooltip(text)
    //   marker.site_id = d.site_id
    //   return marker
    // })
    // // update markers
    // function updateMarkers() {
    //   siteInfoMarkers.forEach((d, i) => {
    //     let value = riverLog[logIndex][d.site_id]
    //     const [max, min] = riverSiteMaxMin[i]
    //     const color = levelColor[parseInt((value - min) / (max - min) * (levelColor.length - 1), 10)]
    //     if (!isNaN(value)) {
    //       d.setRadius((value - min) * 10 + 5)
    //       d.setStyle({
    //         color,
    //         fillColor: color,
    //       })
    //     } else {
    //       d.setRadius(1)
    //     }
    //   })
    // }

    // // typhoon track
    // const typhoonTrackTimes = Object.keys(typhoonTrackLog).map(d => +d)
    // const typhoonTrackPositions = Object.values(typhoonTrackLog)
    // const typhoonTrackPath = L.polyline(typhoonTrackPositions, { color: 'yellow', weight: 1 })
    // typhoonTrackPath.addTo(map)
    // const typhoonPosMarker = L.marker(typhoonTrackPositions[0])
    // typhoonPosMarker.addTo(map)
    // function updateTyphoonTrack() {
    //   const currentTime = Date.parse(riverLog[logIndex].datetime) / 1000
    //   const targetIndex = typhoonTrackTimes.reduce((pre, current, i) => current <= currentTime ? i : pre, 0)
    //   let currentPos
    //   if (targetIndex === 0 || targetIndex === typhoonTrackPositions.length - 1) {
    //     currentPos = typhoonTrackPositions[targetIndex]
    //   } else {
    //     const lastPos = typhoonTrackPositions[targetIndex]
    //     const nextPos = typhoonTrackPositions[targetIndex + 1]
    //     const linearInterpolation = (x, y, i, x_d) => {
    //       return (y[i + 1] - y[i]) / (x[i + 1] - x[i]) * (x_d - x[i]) + y[i]
    //     }
    //     currentPos = [
    //       linearInterpolation(typhoonTrackTimes, typhoonTrackPositions.map(d => d[0]), targetIndex, currentTime),
    //       linearInterpolation(typhoonTrackTimes, typhoonTrackPositions.map(d => d[1]), targetIndex, currentTime)
    //     ]
    //   }
    //   typhoonPosMarker.setLatLng(currentPos)
    // }

    // indicator
    const mapIndicator = L.control.emptyDiv({ position: 'bottomleft', className: 'map-indicator' })
    const mapIndicatorContainer = mapIndicator.addTo(map)
    /// current time indicator
    const currentTimeContainer = document.createElement('div')
    currentTimeContainer.className = 'datetime'
    mapIndicatorContainer.getContainer().appendChild(currentTimeContainer)
    const timeSliderContainer = document.createElement('input')
    /// time slider
    timeSliderContainer.className = 'selector'
    timeSliderContainer.type = 'range'
    timeSliderContainer.min = 0
    timeSliderContainer.max = dates.length - 1
    mapIndicatorContainer.getContainer().appendChild(timeSliderContainer)
    function updateIndicator() {
      currentTimeContainer.innerHTML = dates[logIndex]
      mapIndicatorContainer.value = logIndex
      timeSliderContainer.value = logIndex
    }

    // start animation
    const updateInterval = 200
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
