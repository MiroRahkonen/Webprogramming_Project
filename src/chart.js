let citylist = {}
const disableall_button = document.getElementById("disableall_button")
const enableall_button = document.getElementById("enableall_button")
const update_button = document.getElementById("update_button")
const download_button = document.getElementById("download_button")
const checkbox_kok = document.getElementById("line_kok")
const checkbox_sdp = document.getElementById("line_sdp")
const checkbox_kesk = document.getElementById("line_kesk")
const checkbox_vihr = document.getElementById("line_vihr")
const checkbox_ps = document.getElementById("line_ps")
const checkbox_vas = document.getElementById("line_vas")
const checkbox_rkp = document.getElementById("line_rkp")
const checkbox_kd = document.getElementById("line_kd")
const checkbox_showdatapoints = document.getElementById("show_datapoints")

disableall_button.addEventListener("click", function () {
  const showdatavalue = checkbox_showdatapoints.checked
  document.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
    checkbox.checked = false
  })
  checkbox_showdatapoints.checked = showdatavalue;
  fetchChart()
})

enableall_button.addEventListener("click", function () {
  const showdatavalue = checkbox_showdatapoints.checked
  document.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
    checkbox.checked = true
  })
  checkbox_showdatapoints.checked = showdatavalue;
  fetchChart()
})

update_button.addEventListener("click", function () {
  fetchChart()
})

const jsonQuery = {
  query: [
    {
      code: "Alue",
      selection: {
        filter: "item",
        values: ["000000"]
      }
    },
    {
      code: "Puolue",
      selection: {
        filter: "item",
        values: ["02", "04", "01", "05", "03", "06", "07", "08"]
      }
    },
    {
      code: "Puolueiden kannatus",
      selection: {
        filter: "item",
        values: ["Sar2"]
      }
    }
  ],
  response: {
    format: "json-stat2"
  }
}

const fetchChart = async () => {
  const url =
    "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/kvaa/020_kvaa_2017_tau_102.px"
  var res = await fetch(url)
  if (!res.ok) {
    return
  }
  const data = await res.json()
  const length = data.variables[0].valueTexts.length
  var citynames = data.variables[0].valueTexts
  var citycodes = data.variables[0].values
  for (var i = 0; i < length; i++) {
    var spaceIndex = citynames[i].indexOf(" ")
    var cityname = citynames[i].substring(spaceIndex + 1)
    let city = {
      id: citycodes[i],
      name: cityname
    }
    citylist[i] = city
  }
  fetchData()
}

const fetchData = async () => {
  const params = new URLSearchParams(window.location.search)
  const city_name = Object.fromEntries(params)
  const city = Object.values(city_name)[0]
  document.getElementById("headline").innerHTML = "Party support in " + city
  var cityobj = Object.values(citylist).find((item) => item.name === city)
  if (cityobj !== undefined) {
    var jsonQueryFilter = [cityobj.id]
    jsonQuery.query[0].selection.values = jsonQueryFilter

    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/kvaa/020_kvaa_2017_tau_102.px"
    var res = await fetch(url, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify(jsonQuery)
    })
    if (!res.ok) {
      return
    }
    var data = await res.json()
    makeChart(data)
  }
}

const makeChart = async (data) => {
  let years = Object.values(data.dimension.Vuosi.category.label)
  let parties = Object.values(data.dimension.Puolue.category.label)
  let percentages = data.value
  let included_parties = []
  let included_colors = []

  parties.forEach((party, index) => {
    var percentage = []
    for (var i = 0; i < years.length; i++) {
      percentage.push(percentages[8 * i + index])
    }
    parties[index] = {
      name: party,
      values: percentage.reverse()
    }
  })
  if (checkbox_kok.checked) {
    included_parties.push(parties[0])
    included_colors.push("#006288")
  }
  if (checkbox_sdp.checked) {
    included_parties.push(parties[1])
    included_colors.push("#E11931")
  }
  if (checkbox_kesk.checked) {
    included_parties.push(parties[2])
    included_colors.push("#01954B")
  }
  if (checkbox_vihr.checked) {
    included_parties.push(parties[3])
    included_colors.push("#61BF1A")
  }
  if (checkbox_ps.checked) {
    included_parties.push(parties[4])
    included_colors.push("#FFD500")
  }
  if (checkbox_vas.checked) {
    included_parties.push(parties[5])
    included_colors.push("#BF1E24")
  }
  if (checkbox_rkp.checked) {
    included_parties.push(parties[6])
    included_colors.push("#FFDD93")
  }
  if (checkbox_kd.checked) {
    included_parties.push(parties[7])
    included_colors.push("#2B67C9")
  }
  parties = parties.slice(1)

  const chartdata = {
    labels: years,
    datasets: included_parties
  }
  chart = new frappe.Chart("#chart", {
    data: chartdata,
    type: "line",
    height: 500,
    colors: included_colors,
    xIsSeries: 1,
    valuesOverPoints: checkbox_showdatapoints.checked
  })
  return chart
}
let chart = fetchChart()

download_button.addEventListener("click", function () {
  chart.export()
})
