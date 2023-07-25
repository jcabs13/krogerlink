require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const getKrogerToken = async () => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const scope = process.env.SCOPE; // Adjust as per your requirements

  // Base64 encoding of clientId:clientSecret
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post('https://api.kroger.com/v1/connect/oauth2/token', 'grant_type=client_credentials&scope=' + scope, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
    });

    console.log(response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching Kroger API token:', error);
  }
};

app.post('/webhook', async (req, res) => {
  console.log('Received POST from Glide');

  // Log the request body
  console.log('Request Body:', req.body);

  const rowID = req.body.params.rowID.value;
  const text = req.body.params.zip.value;

  if (!rowID || !text) {
    console.error('rowID or text not provided');
    return res.sendStatus(400);
  }

  const token = process.env.BEARER_TOKEN;
  const krogerToken = await getKrogerToken();

  // Now you can use krogerToken with the Kroger API.
  console.log('Kroger token:', krogerToken);

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
            "NqLF1": text
          },
          "rowID": rowID
        }
      ]
    }
  }).then((response) => {
    console.log(response.data);
    res.sendStatus(200);
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
    res.sendStatus(500);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
