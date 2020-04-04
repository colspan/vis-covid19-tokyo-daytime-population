import * as topojson from 'topojson';

function getYahooPopulationLog() {
  const yahooPopulationLog = './tokyo_population_log.json'
  return new Promise((resolve, reject) => {
    fetch(yahooPopulationLog)
      .then(res => res.json())
      .then(resolve)
      .catch(reject)
  })
}

function getMapData() {
  const mapDataJson = './tokyo23_topo.json'
  return new Promise((resolve, reject) => {
    fetch(mapDataJson)
      .then((res) => res.json())
      .then((data) => {
        const mapData = topojson.feature(
          data,
          data.objects.tokyo23
        )
        resolve(mapData);
      })
      .catch(reject)
  })
}

export {
  getMapData,
  getYahooPopulationLog,
}
