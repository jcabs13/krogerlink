require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Function to get Kroger API token
const getKrogerToken = async () => {
  // ... (same as before)
};

// Endpoint for /getkrogertoken
app.post('/getkrogertoken', async (req, res) => {
  console.log('Received POST for /getkrogertoken');

  try {
    // Get the Kroger API token
    const krogerToken = await getKrogerToken();
    console.log('Kroger API Token:', krogerToken);

    // Push the Kroger API token back to Glide
    const rowID = req.body.params.rowID.value;
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
              "NqLF1": krogerToken
            },
            "rowID": rowID
          }
        ]
      }
    }).then((response) => {
      console.log(response.data);
      // Return the Kroger API token as a response
      return res.status(200).json({ token: krogerToken });
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
      return res.sendStatus(500);
    });

  } catch (error) {
    console.error('Error fetching Kroger API token:', error);
    return res.sendStatus(500);
  }
});

// Existing endpoint for /webhook (unchanged)
app.post('/webhook', async (req, res) => {
  // ... (your existing /webhook logic here)
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
