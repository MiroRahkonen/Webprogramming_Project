let map = L.map("map").setView([65.05, 28.1], 50);
var geoJsonElections;
var osm;
var mun_data = [];
const electionJsonQuery = {
  query: [
    {
      code: "Lukumäärätiedot",
      selection: {
        filter: "item",
        values: [
          "Apro",
          "Suurinpuolue",
          "Pro_01",
          "Pro_02",
          "Pro_03",
          "Pro_04",
          "Pro_05",
          "Pro_06",
          "Pro_07",
          "Pro_08"
        ]
      }
    }
  ],
  response: {
    format: "json"
  }
}

const fetchElectionData = async () => {
  var length = 0;
  const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/kvaa/km_ku.px";
  var res = await fetch(url, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(electionJsonQuery)
  })
  if (!res.ok) {
    return;
  }
  const data = await res.json();

  const res2 = await fetch(url);
  const data2 = await res2.json();
  var cities = data2.variables[0].valueTexts;
  mun_data = {};

  cities.forEach((city, i) => {
    let municipality = {
      name: city,
      id: data2.variables[0].values[i]
    }
    length++
    mun_data[i] = municipality
  })
  var datapoints = []
  data.data.forEach((text, i) => {
    datapoints.push(text.values[0])
  })

  for (var i = 0; i < length; i++) {
    mun_data[i].voteperc = datapoints[10 * i]
    mun_data[i].mostvotes = datapoints[10 * i + 1]
    mun_data[i].kesk = datapoints[10 * i + 2]
    mun_data[i].kok = datapoints[10 * i + 3]
    mun_data[i].ps = datapoints[10 * i + 4]
    mun_data[i].sdp = datapoints[10 * i + 5]
    mun_data[i].vihr = datapoints[10 * i + 6]
    mun_data[i].vas = datapoints[10 * i + 7]
    mun_data[i].rkp = datapoints[10 * i + 8]
    mun_data[i].kd = datapoints[10 * i + 9]

    const mostvotes = datapoints[10 * i + 1]
    if (mostvotes == 1) {
      mun_data[i].mostvotes_name = "Keskusta"
      mun_data[i].mostvotes_perc = mun_data[i].kesk
    } else if (mostvotes == 2) {
      mun_data[i].mostvotes_name = "Kokoomus"
      mun_data[i].mostvotes_perc = mun_data[i].kok
    } else if (mostvotes == 3) {
      mun_data[i].mostvotes_name = "Perus suomalaiset"
      mun_data[i].mostvotes_perc = mun_data[i].ps
    } else if (mostvotes == 4) {
      mun_data[i].mostvotes_name = "SDP"
      mun_data[i].mostvotes_perc = mun_data[i].sdp
    } else if (mostvotes == 5) {
      mun_data[i].mostvotes_name = "Vihreät"
      mun_data[i].mostvotes_perc = mun_data[i].vihr
    } else if (mostvotes == 6) {
      mun_data[i].mostvotes_name = "Vasemmisto"
      mun_data[i].mostvotes_perc = mun_data[i].vas
    } else if (mostvotes == 7) {
      mun_data[i].mostvotes_name = "RKP"
      mun_data[i].mostvotes_perc = mun_data[i].rkp
    } else if (mostvotes == 8) {
      mun_data[i].mostvotes_name = "Kristillisdemokraatit"
      mun_data[i].mostvotes_perc = mun_data[i].kd
    } else {
      mun_data[i].mostvotes_name = "Other"
      mun_data[i].mostvotes_perc = 0
    }
  }
  fetchElectionBorderData()
}

const getElectionFeature = (feature, layer) => {
  if (!feature.properties.nimi) return
  var name = feature.properties.nimi
  var cityobj = Object.values(mun_data).find((item) => item.name === name)
  if (cityobj !== undefined) {
    layer.bindPopup(
      `
      <h3>${cityobj.name}</h3>
      <ul>
        <li>Percentage of voters(%): ${cityobj.voteperc}</li>
        <li>Biggest party: ${cityobj.mostvotes_name}</li>
        <li>Votes for biggest party(%): ${cityobj.mostvotes_perc}</li>
        <li><a href="chart.html?city_name=${cityobj.name}">Show yearly support data</a></li>
        </ul>`
    )
  }
  layer.bindTooltip(name)
}

const getElectionStyle = (feature) => {
  var areacolor;
  var mostvotes = 0;
  var cityobj = Object.values(mun_data).find(
    (item) => item.id === feature.properties.kunta
  )
  if (cityobj !== undefined) {
    mostvotes = cityobj.mostvotes;
  }

  if (mostvotes == 1) {areacolor = "#01954B"} //kesk
  else if (mostvotes == 2) {areacolor = "#006288"} //kok
  else if (mostvotes == 3) {areacolor = "#FFD500"} //ps
  else if (mostvotes == 4) {areacolor = "#E11931"} //sdp
  else if (mostvotes == 5) {areacolor = "#61BF1A"} //vihr
  else if (mostvotes == 6) {areacolor = "#BF1E24"} //vas
  else if (mostvotes == 7) {areacolor = "#FFDD93"} //rkp
  else if (mostvotes == 8) {areacolor = "#2B67C9"} //kd
  else {areacolor = "gray"};

  return {
    color: `${areacolor}`,
    weight: 2
  }
}

const fetchElectionBorderData = async () => {
  const url = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
  const res = await fetch(url);
  const data_borders = await res.json();
  initElectionMap(data_borders);
}

const initElectionMap = (data) => {
  geoJsonElections = L.geoJSON(data, {
    onEachFeature: getElectionFeature,
    style: getElectionStyle
  }).addTo(map)
  osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map)
  map.fitBounds(geoJsonElections.getBounds());

  let basemaps = {
    OpenStreetMap: osm
  }
  let overlaymaps = {
    "Election data": geoJsonElections
  }

  let layerControl = L.control.layers(basemaps,overlaymaps).addTo(map);
}

fetchElectionData();