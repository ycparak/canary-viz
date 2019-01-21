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
  let attackerCountData = attackerData(alerts);

  // Display the respective visualisations
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
    let desc = abbreviate(type)
    let newObj = new Object({
      'description': type,
      'desc': desc,
      'total': 0,
      'src_host': {}
    });
    data.push(newObj);
  });
  alerts.map(alert => {
    let desc = alert.description;
    let ip = alert.src_host;
    data.forEach(d => {
      if (d.description === desc) {
        d.total++;
        if (d.src_host[ip] !== undefined) {
          d.src_host[ip] = d.src_host[ip] + 1;
        }
        else if (ip !== "") {
          d.src_host = {
            ...d.src_host,
            [`${ip}`]: 1
          }
        }
      }
    });
  });

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

/*
**
** VISUALISATIONS
**
*/

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

// Abreviate descriptions
function abbreviate(str1) {
  var split_names = str1.trim().split(" ");
  if (split_names.length > 1) {
    return (split_names[0] + " " + split_names[1].charAt(0) + ".");
  }
  return split_names[0];
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