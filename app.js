// require and configure dotenv if you haven't done it already
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// New /getKrogerToken endpoint
app.get('/getKrogerToken', (req, res) => {
  // Add any logic here to fetch the Kroger token
  const krogerToken = 'YOUR_KROGER_TOKEN'; // Replace with your actual logic to get the token

  // Return the Kroger token as a response
  res.status(200).json({ token: krogerToken });
});

// Existing /webhook endpoint moved here
app.post('/webhook', (req, res) => {
  console.log('Received POST from Glide');

  // Log the request body
  console.log('Request Body:', req.body);

  const rowID = req.body.params.rowID.value;
  const text = req.body.params.text.value;

  if (!rowID || !text) {
    console.error('rowID or text not provided');
    return res.sendStatus(400);
  }

  // Use the /getKrogerToken endpoint to fetch the Kroger token
  axios.get('http://localhost:3000/getKrogerToken')
    .then((response) => {
      const token = response.data.token;

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
    })
    .catch((error) => {
      console.log('Error fetching Kroger token:', error.message);
      res.sendStatus(500);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
