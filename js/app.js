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

// Higher order function responsible for controling data and d3 visualisations.
function output(data) {
  // Basic information
  let alerts = data.alerts;
  let devices = data.device_list;
  let numAlerts = alerts.length;
  let numDevices = devices.length;

  // Attackers information
  let numIPMaskers = calcIPMaskers(alerts);
  let uniqueAttackers = calcUniqueAttackers(alerts);
  let numUniqueAttackers = uniqueAttackers.length;
  console.log(numUniqueAttackers);
}

function calcIPMaskers(alerts) {
  let total = 0;
  alerts.forEach(alert => {
    let src = alert.src_host;
    if (src === "") {
      total = total + 1;
    }
  });
  return total;
}

function calcUniqueAttackers(alerts) {
  let arrUniqueAttackers = []
  alerts.forEach(alert => {
    let src = alert.src_host;
    if (!arrUniqueAttackers.includes(src) && src !== "") {
      arrUniqueAttackers.push(src)
    }
  });
  return arrUniqueAttackers;
}