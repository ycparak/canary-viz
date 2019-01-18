// Get JSON data using the fetch api and ES7 async/await
let getData = getJSON();
async function getJSON() {
  try {
    const response = await fetch('../data/data.json')
    const data = await response.json();
    output(data);
  }
  catch {
    console.log(error);
  }
}

function output(data) {
  let alerts = data.alerts;
  let device_list = data.device_list;
}