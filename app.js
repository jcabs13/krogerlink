require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(bodyParser.json()); // for parsing application/json

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

function getKrogerLocations(rowID, zip, krogerToken) {
  return new Promise((resolve, reject) => {
    if (!rowID || !zip || !krogerToken) {
      console.error('rowID, zip, or krogerToken not provided');
      return reject('Invalid parameters');
    }

    const baseUrl = 'https://api.kroger.com/v1/locations';
    const queryParams = `filter.zipCode.near=${zip}&filter.limit=10`;

    axios.get(`${baseUrl}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${krogerToken}`
      }
    })
      .then(response => {
        const krogerLocations = response.data;

        if (krogerLocations && krogerLocations.locations && krogerLocations.locations.length > 0) {
          const firstLocation = krogerLocations.locations[0];
          const address = firstLocation.address;
          const addressString = JSON.stringify(address);

          console.log('Kroger Locations:', addressString);
          resolve({ addressString });
        } else {
          console.error('No Kroger locations found.');
          reject('No locations found');
        }
      })
      .catch(error => {
        console.error('Error getting Kroger locations:', error);
        reject(error);
      });
  });
}

// Usage in Express.js route
app.post('/getKrogerLocations', (req, res) => {
  console.log('Received POST from Glide');
  console.log('Request Body:', req.body);

  const rowID = req.body.params.rowID.value;
  const zip = req.body.params.zip.value;
  const krogerToken = req.body.params.krogerToken.value;

  getKrogerLocations(rowID, zip, krogerToken)
    .then(location => {
      res.status(200).json(location);
    })
    .catch(error => {
      if (error === 'Invalid parameters') {
        res.sendStatus(400);
      } else if (error === 'No locations found') {
        res.sendStatus(404);
      } else {
        res.sendStatus(500);
      }
    });
});



const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
