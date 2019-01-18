var getData = getJSON();
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
  console.log(data.alerts[0]);
}