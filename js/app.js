/*
**
** PULL DATA
**
*/
/*
The fetch api has limited browser supoort and yet I still chose to use it.
Why? Because it demonstrates my knowledge of it, ES6/7 and because of its clean syntax.
I can still go the standard XHR/JQuery/Axios/D3 route just chose not to.
*/
// Get JSON data using the fetch api and ES7 async/await
getJSON();
async function getJSON() {
  try {
    const response = await fetch('../data/data.json');
    const data = await response.json();
    quaterback(data);
  }
  catch(error) {
    console.log(error); 
  }
}

/*
**
** QUATERBACK (CONTROL) FUNCTION
**
*/
// Higher order function responsible for conduction process flow.
function quaterback(data) {
  // Change the the created_printable dates to be more readable  
  let alerts = data.alerts;
  let devices = data.device_list;
  let alertsWithReadableDate = data.alerts.map(alert => {
    var returnValue = {...alert};

    let created = alert.created_printable;
    let createdDate = new Date(created);
    let day = createdDate.getDate();
    let month = createdDate.getMonth();
    let year = createdDate.getFullYear();
    let date = day + "/" + month + "/" + year + " " + createdDate.getHours() + ":" + createdDate.getMinutes() + ":" + createdDate.getSeconds();

    returnValue.created_printable = date;
    return returnValue;
  })

  // DATA PROCESSING - Process and clean data for the different visualisations
  let descriptionCountData = typesOfAttacksData(alerts);
  let ipAttacksPerDescriptionData = ipAttacksPerDescription(alerts);
  let attackerCountData = attackerData(alerts);
  let deviceCountData = deviceData(alerts, devices);
  let recentIncidentData = mostRecentIncidentData(alertsWithReadableDate);

  // DATA VISUALISATION - Display the respective visualisations
  displayBarChart(descriptionCountData);
  displayPieChart(attackerCountData, ".attacker-pie", "IP Address", "attackerGroup");
  displayPieChart(deviceCountData, ".device-pie", "Device ID", "deviceGroup");
  dispplayStackedBarChart(ipAttacksPerDescriptionData, ".attack-breakdown", retrieveTypesOfAttacks(alerts));
  displayRecentIncidents(recentIncidentData);
  displayIncidentLog(alertsWithReadableDate);
}

/*
**
** DATA PROCESSING
**
*/
// Populate array with objects containing a description and the amount of times an attack of that description has occured
function typesOfAttacksData(alerts) {
  let attackTypes = retrieveTypesOfAttacks(alerts);
  let data = [];

  attackTypes.forEach(type => {
    let desc = abbreviate(type)
    let newObj = new Object({
      'description': type,
      'desc': desc,
      'total': 0,
      // 'src_host': {}
    });
    data.push(newObj);
  });
  alerts.map(alert => {
    let desc = alert.description;
    let ip = alert.src_host;
    data.forEach(d => {
      if (d.description === desc) {
        d.total++;
        /*if (d.src_host[ip] !== undefined) {
          d.src_host[ip] = d.src_host[ip] + 1;
        }
        else if (ip !== "") {
          d.src_host = {
            ...d.src_host,
            [`${ip}`]: 1
          }
        }*/
      }
    });
  });

  return data;
}

// Populate array with objects containing an ip, total attacks by ip, total attacks by ip per description
function ipAttacksPerDescription(alerts) {
  let attackTypes = retrieveTypesOfAttacks(alerts);
  let attackers = retrieveUniqueAttackers(alerts);

  // Remove 'Canary Disconnected' from attackers array which should contain just IP's
  let index = attackers.indexOf("Canary Disconnected");
  attackers.splice(index, 1);

  // Create an array of objects with a specific structure
  let data = [];
  attackers.forEach(ip => {
    let newObj = new Object();
    attackTypes.forEach(type => {
      newObj.ip = ip;
      newObj.total = 0;
      newObj[`${type}`] = 0
    })
    data.push(newObj);
  });
  // Populate array of objects with data from alerts
  alerts.map(alert => {
    let desc = alert.description;
    let ip = alert.src_host;
    data.forEach(d => {
      let keys = Object.keys(d);
      keys.shift();
      keys.shift();
      if (d.ip === ip) {
        d.total++;
        keys.map(key => {
          if (key === desc) {d[`${desc}`]++} 
        })
      }
    })
  })

  return data;
}

// Populate array with objects containing a src_ip and the amount of times it’s caused an attack
function attackerData(alerts) {
  let attackerTypes = retrieveUniqueAttackers(alerts);
  let data = [];

  attackerTypes.forEach(ip => {
    let newObj = new Object({
      'ip': ip,
      'total': 0,
    });
    data.push(newObj);
  });
  alerts.map(alert => {
    let ip = alert.src_host !== "" ? alert.src_host : "Canary Disconnected";
    data.forEach(d => {
      if (d.ip == ip) d.total = d.total + 1;
    });
  });

  return data;
}

// Populate array with objects containing a node_ip and the amount of incidents relating to that device
function deviceData(alerts, devices) {
  let deviceTypes = retrieveUniqueDevices(alerts);
  let data = [];

  deviceTypes.forEach(ip => {
    let newObj = new Object({
      ip: ip,
      description: '',
      total: 0,
    });
    data.push(newObj);
  });
  alerts.map(alert => {
    let ip = alert.node_id;
    data.forEach(d => {
      if (d.ip === ip) d.total++;
    })
  })
  devices.map(device => {
    let node_id = device.node_id;
    data.forEach(d => {
      if (d.ip === node_id) {
        d.description = device.description;
      }
    })
  })

  return data;
}

// Populate array with objects containing the 6 most recent incidents
function mostRecentIncidentData(alerts) {
  let data = [];
  for(let i = 0; i < 6; i++) {
    data.push(alerts[i])
  }
  alerts.forEach(alert => {
    for(let i = 0; i < data.length; i++) {
      if (data[i].created < alert.created) {
        data.splice(i, 1)
        data.push(alert);
      }
    }
  })
  return data;
}
/*
**
** VISUALISATIONS
**
*/
// Display bar chart
function displayBarChart(data) {

  let totalArray = [];
  data.map(d => {
    totalArray.push(d.total);
  });

  let height = 212;
  let width = 600;
  let padding = {top: 12, right: 60, bottom: 27, left: 60}

  let canvas = d3.select('#description')
    .append("svg")
      .attr("class", "barChart")
      .attr("width", width + padding.left + padding.right)
      .attr("height", height + padding.top + padding.bottom)
    .append("g")
      .attr("transform", "translate(" + padding.left + ", " + padding.top + ")")

  // Set x scale
  let x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1)

  let yAxis = canvas.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(-4, -1)")

  let xAxis = canvas.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")

  function update(data, t) {
    let barWidth = width / data.length;

    let yScale = d3.scaleLinear()
      .domain([0, d3.max(totalArray)])
      .range([height, 0]);

    x.domain(data.map(d => {
      return d.desc;
    }))

    yAxis.call(d3.axisLeft(yScale));
    xAxis.call(d3.axisBottom(x));

    let bar = canvas.selectAll(".bar")
      .data(data);

    let tooltip = d3.select("body")
      .append("div")
      .classed("svg-tooltip", true)

    bar.enter()
      .append("rect")
        .style("border-radius", "60x")
        .attr("class", "bar")
        .attr("fill", "#566CD6")
        .attr("x", (d, i) => {
          return i * barWidth;
        })
        .attr("width", barWidth - 1)
      .on("mouseover", function() {
        d3.select(this).attr("fill", "#ADEEFF");
      })
      .on("mousemove", (d) => {   
        tooltip
          .style("opacity", 1)
          .style("cursor", "pointer")
          .style("left", d3.event.x - (tooltip.node().offsetWidth / 2) + "px")
          .style("top", d3.event.y + 30 + "px")
          .html("<strong>Description: </strong> " + d.description + "<br><span><strong>Incidents:</strong> " + d.total + "</span><br><br><span class='note'>Click for more info.</span>");
      })
      .on("mouseout", function() {
        d3.select(this).transition().attr("fill", "#566CD6");
        tooltip
          .style("opacity", 0)
      })
      // On click search the incident log
      .on("click", (d) => {
        $("#search-field").val(d.description);
        $("#search-field").focus();
      })
      .merge(bar)
      .transition(t)
        .attr("y", d => {
          return yScale(d.total);
        })
        .attr("height", d => {
          return height - yScale(d.total);
        });
  }

  update(data);
}

// Display pie/doghnut chart 
function displayPieChart(data, id, infoName, groupName) {
  let width = 250;
  let height = 251;

  let dataDescription = [];
  data.forEach(i => { dataDescription.push(i.ip); });
  
  let tooltip = d3.select("body")
    .append("div")
      .classed("svg-tooltip", true)

  // Set svg measurements
  d3.select(id)
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', 'translate(' + width / 2 + ', ' + height / 2 + ')')
      .classed(groupName, true)

  // Generate the mathematics of the svg
  let arcs = d3.pie()
    .value(d => d.total)(data);

  // Set the look of the svg
  let path = d3.arc()  
    .outerRadius(width / 2 - 10)
    .innerRadius(width / 4)
    .cornerRadius(6)
    .padAngle(0.01)

  // Render the svg
  d3.select("." + groupName)
    .selectAll('.arc')
    .data(arcs)
    .enter()
    .append('path')
      .classed('arc', true)
      .attr('fill', '#576CD6')
      .attr('stroke', '#F7FAFC')
      .attr('d', path)
      // Tooltip mouse over
      .on("mouseover", function() {
        d3.select(this)
          .attr("fill", "#ADEEFF");
      })
      .on("mousemove", (d) => {
        groupName === "attackerGroup" && tooltip
          .style("opacity", 1)
          .style("left", d3.event.x - (tooltip.node().offsetWidth / 2) + "px")
          .style("top", d3.event.y + 30 + "px")
          .html("<strong>" + infoName + ":</strong> " + d.data.ip + "<br><span><strong>Incidents:</strong> " + d.value + "</span><br><br><span class='note'>Click for more info.</span>");

        groupName === "deviceGroup" && tooltip
            .style("opacity", 1)
            .style("left", d3.event.x - tooltip.node().offsetWidth / 2 + "px")
            .style("top", d3.event.y + 30 + "px")
            .html("<strong>" + infoName + ":</strong> " + d.data.ip + "<br><strong>Description:</strong> " + d.data.description + "</strong><br><strong>Incidents:</strong> " + d.value + "<br><br><span class='note'>Click for more info.</span>");
      })
      // Tooltip mouse away
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .attr("fill", "#576CD6");
        tooltip
          .style("opacity", 0)
      })
      // On click search the incident log
      .on("click", (d) => {
        $("#search-field").val(d.data.ip);
        $("#search-field").focus();
      })
}

// Display stacked bar chart
function dispplayStackedBarChart(data, id, initialKeys) {
  //console.log(data);

  // Create the svg
  let svg = d3.select(id)
  let margin = { top: 20, right: 20, bottom: 50, left: 40 };
  let width = 1000 - margin.left - margin.right;
  let height = 400 - margin.top - margin.bottom;
  // Set the colors
  let z = d3.scaleOrdinal().range(['#A7EEEF', '#97DCEB', '#ADE9F0', '#77ABE1', '#678DDC', '#586CD6', '#4F52C6', '#5447B5', '#593FA4', '#5B3793', '#5B2F81', '#58286F']);
  let g = svg
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
  
  // Set x scale
  let x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1)

  // Set y scale
  let y = d3.scaleLinear()
    .rangeRound([height, 0]);

  // Create chart
  let keys = initialKeys;

  data.sort(function (a, b) { return b.total - a.total; });

  x.domain(data.map(d => {
    return d.ip;
  }))
  y.domain([0, d3.max(data, d => {
    return d.total 
  })]).nice();
  z.domain(keys);

  g.append("g")
    .selectAll("g")
      .data(d3.stack().keys(keys)(data))
      .enter()
    .append("g")
      .attr("fill", d => { return z(d.key) })
    .selectAll("rect")
    .data(d => { return d })
    .enter()
    .append("rect")
    .attr("class", "rect")
      .attr("x", d => { return x(d.data.ip) })
    .attr("y", d => { 
      if (isNaN(y(d[1]))) return 0
      else return y(d[1])
    })
      .attr("height", d => { 
        if (isNaN(Math.abs(y(d[0]) - y(d[1])))) return 0
        else return Math.abs(y(d[0]) - y(d[1]));
      })
      .attr("width", x.bandwidth())
    // On click search the incident log
    .on("click", (d) => {
      $("#search-field").val(d.data.ip);
      $("#search-field").focus();
    })

  g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  g.append("g")
      .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start");
  
  let legend = g.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", z);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(function (d) { return d; });
}
 
// Function to display the rcent incidents
function displayRecentIncidents(alerts) {
  // Structure of JSON object for listing, sorting and searching the incidents
  const options = {
    valueNames: [
      "created",
      "created_printable",
      "description",
    ],
    item: `<tr><td class="description td-main"></td><td class="created_printable text-right"</tr>`
  };
  let recentList = new List('recent-list', options, alerts); // Instantiate new incident log
}
 
// Function to display the incident log
function displayIncidentLog(alerts) {
  // Structure of JSON object for listing, sorting and searching the incidents
  const options = {
    valueNames: [
      "acknowledged",
      "created",
      "created_age",
      "created_age_seconds",
      "created_printable",
      "description",
      "dst_host",
      "dst_port",
      "events_count",
      "ip_address",
      "ippers",
      "key",
      "local_time",
      "logtype",
      "mac_address",
      "node_id",
      "notified",
      "src_host",
      "src_host_reverse",
      "src_port",
      "updated"
    ],
    item: `<tr><td class="key td-main"></td><td class="description"></td><td class="created_printable text-right"</tr>`
  };
  let incidentList = new List('incident-list', options, alerts); // Instantiate new incident log

  // On search
  $('#search-field').on('focus', function () {
    $("#v-pills-incidents-tab").tab("show"); // Got to incident log screen
    var searchString = $(this).val(); // Search
    incidentList.search(searchString);
  });
}

/*
**
** HELPER FUNCTIONS
**
*/
// Return the unique types of attacks
function retrieveTypesOfAttacks(alerts) {
  let arrTypesOfAttacks = []
  alerts.forEach(alert => {
    let desc = alert.description;
    if (!arrTypesOfAttacks.includes(desc)) {
      arrTypesOfAttacks.push(desc);
    }
  });
  return arrTypesOfAttacks;
}

// Return the src_host (IP) of every unique attacker
function retrieveUniqueAttackers(alerts) {
  let arrUniqueAttackers = []
  alerts.forEach(alert => {
    let src = alert.src_host !== "" ? alert.src_host : "Canary Disconnected";
    if (!arrUniqueAttackers.includes(src)) {
      arrUniqueAttackers.push(src)
    }
  });
  return arrUniqueAttackers;
}

// Return the node_id (IP) of every unique device
function retrieveUniqueDevices(alerts) {
  let arrUniqueDevices = [];
  alerts.forEach(alert => {
    let id = alert.node_id;
    if (!arrUniqueDevices.includes(id)) {
      arrUniqueDevices.push(id);
    }
  });
  return arrUniqueDevices;
}

// Abreviate descriptions
function abbreviate(str1) {
  var split_names = str1.trim().split(" ");
  if (split_names.length > 1) {
    return (split_names[0] + " " + split_names[1].charAt(0) + ".");
  }
  return split_names[0];
}

// Change from current page to incident log page
function changeToLog() {
  $("#v-pills-incidents-tab").tab("show");
}