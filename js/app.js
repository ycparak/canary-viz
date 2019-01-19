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
  // Basic information
  let alerts = data.alerts;
  let devices = data.device_list;
  let numAlerts = alerts.length;
  let numDevices = devices.length;

  // Attackers information
  let uniqueAttackers = retrieveUniqueAttackers(alerts);
  let numUniqueAttackers = uniqueAttackers.length;

  // Type of attack information
  let typesOfAttacks = retrieveTypesOfAttacks(alerts);
  let numDisconnects = calcDisconnects(alerts);
  let datesOfAttacks = retrieveDatesOfAttacks(alerts);
  // let attackBreakdown = breakdownOfAttacks(alerts);

  console.log(datesOfAttacks);
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

function retrieveDatesOfAttacks(alerts) {
  let arrDates = [];
  alerts.forEach(alert => {
    let created = alert.created_printable;
    let createdDate = new Date(created);
    let day = createdDate.getDate();
    let month = createdDate.getMonth();
    let year = createdDate.getFullYear();
    let date = day + '/' + month + '/' + year
    arrDates.push(date);
  });
  return arrDates;
}