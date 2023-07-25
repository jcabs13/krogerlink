require('dotenv').config();
const axios = require('axios');

const token = process.env.BEARER_TOKEN;

axios({
  method: 'post',
  url: 'https://api.glideapp.io/api/function/mutateTables',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  data: {
    "appID": "mtVYx3j3ot4FzRCdp3q4",
    "mutations": [
      {
        "kind": "set-columns-in-row",
        "tableName": "native-table-MX8xNW5WWoJhW4fwEeN7",
        "columnValues": {
          "NqLF1": "Received from webhook"
        },
        "rowID": "0f3MGHVYQTSHn4FwKReDZw" // replace 'ROW-ID' with your actual row id
      }
    ]
  }
}).then((response) => {
  console.log(response.data);
}).catch((error) => {
  if (error.response) {
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    console.log(error.request);
  } else {
    console.log('Error', error.message);
  }
  console.log(error.config);
});
