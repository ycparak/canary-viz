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
  item: '<tr><td class="key td-main"></td><td class="description"></td><td class="created_printable"></td></tr>'
};

// Get JSON data using the fetch api and ES7 async/await
/*
    The fetch api has limited browser supoort and yet I still chose to use it.
    Why? Because it demonstrates my knowledge of it, ES6/7 and because of its clean syntax.
    I can still go the standard XHR/JQuery/Axios route just chose not to.
*/
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

// Higher order function responsible for controling/processing data and d3 visualisations.
function output(data) {
  // Change the the created_printable dates to be more readable  
  let alerts = data.alerts.map(alert => {
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
  let devices = data.device_list;
  createIncidentLog(alerts);

  let numAlerts = alerts.length;
  let numDevices = devices.length;

  // Attackers information
  let uniqueAttackers = retrieveUniqueAttackers(alerts);
  let numUniqueAttackers = uniqueAttackers.length;

  // Type of attack information
  let typesOfAttacks = retrieveTypesOfAttacks(alerts);
  let numDisconnects = calcDisconnects(alerts);
}

// Function to create the incident log with search and sort functionality
function createIncidentLog(alerts) {
  let incidentList = new List('incident-list', options, alerts);

  $('#search-field').on('keyup', function () {
    var searchString = $(this).val();
    incidentList.search(searchString);
  });
}

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

// The number of times an alert was triggered because of a Canary Disconnect
function calcDisconnects(alerts) {
  let total = 0;
  alerts.forEach(alert => {
    let desc = alert.description;
    if (desc === "Canary Disconnected") {
      total = total + 1;
    }
  });
  return total;
}