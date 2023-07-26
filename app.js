//token and location webhooks working
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const getKrogerToken = () => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const scope = process.env.SCOPE; // Adjust as per your requirements

  // Base64 encoding of clientId:clientSecret
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  return axios.post('https://api.kroger.com/v1/connect/oauth2/token', 'grant_type=client_credentials&scope=' + scope, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials
    },
  })
    .then(response => response.data.access_token)
    .catch(error => {
      console.error('Error fetching Kroger API token:', error);
      throw error;
    });
};

app.post('/getKrogerToken', (req, res) => {
  console.log('Received POST from Glide');

  // Log the request body
  console.log('Request Body:', req.body);

  const rowID = req.body.params.rowID?.value;
  const zip = req.body.params.zip?.value;

  if (!rowID || !zip) {
    console.error('rowID or zip not provided');
    return res.sendStatus(400);
  }

  getKrogerToken()
    .then(krogerToken => {
      const token = process.env.BEARER_TOKEN;

      return axios({
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
                "NqLF1": krogerToken
              },
              "rowID": rowID
            }
          ]
        }
      });
    })
    .then(response => {
      console.log(response.data);
      res.sendStatus(200);
    })
    .catch(error => {
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
      res.sendStatus(500);
    });
});

const getKrogerLocations = async (krogerToken, zip) => {
  const url = `https://api.kroger.com/v1/locations?filter.zipCode.near=${zip}&filter.limit=3`;

  let data;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${krogerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data = await response.json();
  } catch (error) {
    console.error('Error fetching data from Kroger:', error);
    return;
  }

  if (data && Array.isArray(data.data)) {
    let address1 = data.data[0]?.address.addressLine1; // getting the address of the first location
    let address2 = data.data[1]?.address.addressLine1; // getting the address of the second location
    let address3 = data.data[2]?.address.addressLine1; // getting the address of the third location
    let ID1 = data.data[0]?.locationId; // getting the address of the first location
    let ID2 = data.data[1]?.locationId; // getting the address of the second location
    let ID3 = data.data[2]?.locationId; // getting the address of the third location

    // constructing a single string with all three addresses
    let addresses = `${address1}, ${ID1}, ${address2}, ${ID2}, ${address3}, ${ID3}`;

    console.log('ADDRESSES:', addresses);

    return addresses;
  } else {
    console.error('Invalid data structure from Kroger:', data);
    return null;
  }
};

app.post('/getKrogerLocations', (req, res) => {
  console.log('Received POST from Glide');

  // Log the request body
  console.log('Request Body:', req.body);

  const rowID = req.body.params.rowID?.value;
  const zip = req.body.params.zip?.value;
  const krogerToken = req.body.params.krogerToken?.value;

  console.log('INPUTrowID:', rowID);
  console.log('INPUTzip:', zip);
  console.log('INPUTkrogerToken:', krogerToken);

  if (!rowID || !zip || !krogerToken) {
    console.error('rowID, krogerToken, or zip not provided');
    return res.sendStatus(400);
  }

  getKrogerLocations(krogerToken, zip)
    .then(addresses => {
      const token = process.env.BEARER_TOKEN;

      return axios({
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
                "5gQpv": addresses
              },
              "rowID": rowID
            }
          ]
        }
      });
    })
    .then(response => {
      console.log(response.data);
      res.sendStatus(200);
    })
    .catch(error => {
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
      res.sendStatus(500);
    });
});

const getAisle = async (term, locID, token) => {
  const url = `https://api.kroger.com/v1/products?filter.term={{term}}&filter.locationId={{locID}}`;

  let data;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${krogerToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data = await response.json();
  } catch (error) {
    console.error('Error fetching data from Kroger:', error);
    return;
  }
};

app.post('/getAisle', (req, res) => {
  console.log('Received POST from Glide');

  // Log the request body
  console.log('Request Body:', req.body);

  const term = req.body.params.term?.value;
  const locID = req.body.params.locID?.value;
  const token = req.body.params.token?.value;

  console.log('INPUT term:', term);
  console.log('INPUT locID:', locID);

  if (!term || !locID) {
    console.error('term of locationID not provided');
    return res.sendStatus(400);
  }

  getAisle(term, locID, token)
    .then(addresses => {
      const token = process.env.BEARER_TOKEN;

      return axios({
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
                "HenO1": "TestAisle"
              },
              "rowID": rowID
            }
          ]
        }
      });
    })
    .then(response => {
      console.log(response.data);
      res.sendStatus(200);
    })
    .catch(error => {
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
      res.sendStatus(500);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
