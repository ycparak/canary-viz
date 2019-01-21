// Structure of JSON object for listing, sorting and searching the incidents
var options = {
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

/*
**
** PULL DATA
**
*/
/*
The fetch api has limited browser supoort and yet I still chose to use it.
Why? Because it demonstrates my knowledge of it, ES6/7 and because of its clean syntax.
I can still go the standard XHR/JQuery/Axios route just chose not to.
*/
// Get JSON data using the fetch api and ES7 async/await
getJSON();
async function getJSON() {
  try {
    const response = await fetch('../data/data.json');
    const data = await response.json();
    output(data);
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
function output(data) {
  // Change the the created_printable dates to be more readable  
  let alerts = data.alerts;
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
  // Get basic data
  let devices = data.device_list;
  let numAlerts = alerts.length;
  let numDevices = devices.length;

  // Process and clean data for the different visualisations
  let attackDescriptionData = typesOfAttacksData(alerts);

  // Display the respective visualisations
  displayDescriptionViz(attackDescriptionData);
  displayIncidentLog(alertsWithReadableDate);
  document.getElementById("num-incidents").innerText = numAlerts;
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
    let newObj = new Object();
    newObj.description = type;
    newObj.quantity = 0;
    data.push(newObj);
  });
  alerts.map(alert => {
    let desc = alert.description;
    data.forEach(d => {
      if (d.description === desc) {
        d.quantity++;
      }
    });
  });

  return data;
}

/*
**
** VISUALISATIONS
**
*/
// Function to display the histogram showing the number of attacks by each description
function displayDescriptionViz(data) {
  let width = 500;
  let height = 400;
  let numBars = data.length;
  let barPadding = 5;
  let barWidth = width / numBars - barPadding;
  let maxQuantity = d3.max(data, d => { return d.quantity });
  let yScale = d3.scaleLinear().domain([0, maxQuantity]).range([height, 0]);

  let bars = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height)
                .selectAll(".bar")
                .data(data)
                .enter()
                .append("g")
                  .classed("bar", true)

  bars
    .append("rect")
      .attr("y", d => yScale(d.quantity))
      .attr("x", (d, i) => (barWidth + barPadding) * i)
      .attr("width", barWidth)
      .attr("height", d => height - yScale(d.quantity))
      .attr("fill", "#6772E5")

  bars
    .append("text")
      .text(d => d.description)
      .attr("transform", "rotate(-90)")
      .attr("y", (d, i) => ((barWidth + barPadding) * i) + (barWidth / 2))
      .attr("x", - height)
      .style("alignment-baseline", "middle");
}

// Function to display the incident log
function displayIncidentLog(alerts) {
  let incidentList = new List('incident-list', options, alerts); // Instantiate new incident log

  // On search
  $('#search-field').on('keyup', function () {
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

/*
// Return the src_host (IP) of every unique attacker
function retrieveUniqueAttackers(alerts) {
  let arrUniqueAttackers = []
  alerts.forEach(alert => {
    let src = alert.src_host;
    if (!arrUniqueAttackers.includes(src) && src !== "") {
      arrUniqueAttackers.push(src)
    }
  });
  return arrUniqueAttackers;
}
*/