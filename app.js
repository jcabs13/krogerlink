require('dotenv').config();
const express = require('express');
const axios = require('axios');
const base64 = require('base-64');
const app = express();

app.use(express.json());

app.post('/getKrogerToken', (req, res) => {
  console.log('Received POST from Glide');
  console.log('Request Body:', req.body);

  const rowID = req.body.params.rowID?.value;
  const zip = req.body.params.zip?.value;

  if (!rowID || !zip) {
    console.error('rowID or zip not provided');
    return res.sendStatus(400);
  }

  // Encode the Client ID and Client Secret in Base64 format
  const krogerClientID = process.env.KROGER_CLIENT_ID;
  const krogerClientSecret = process.env.KROGER_CLIENT_SECRET;
  const credentials = base64.encode(`${krogerClientID}:${krogerClientSecret}`);

  // Make a POST request to Kroger API for authentication
  axios({
    method: 'post',
    url: 'https://api.kroger.com/v1/connect/oauth2/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    data: 'grant_type=client_credentials&scope={{SCOPE}}'
  })
    .then((response) => {
      // Extract the access token from the Kroger API response
      const krogerAccessToken = response.data.access_token;

      // Now, send the access token back to Glide
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
                "NqLF1": krogerAccessToken // Sending Kroger access token instead of zip
              },
              "rowID": rowID
            }
          ]
        }
      })
        .then((response) => {
          console.log(response.data);
          res.sendStatus(200);
        })
        .catch((error) => {
          // Error handling for Glide API request
          console.log('Error in Glide API:', error.message);
          res.sendStatus(500);
        });
    })
    .catch((error) => {
      // Error handling for Kroger API request
      console.log('Error in Kroger API:', error.message);
      res.sendStatus(500);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
