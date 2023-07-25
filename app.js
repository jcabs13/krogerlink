const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const getKrogerToken = async () => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const scope = process.env.SCOPE;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post('https://api.kroger.com/v1/connect/oauth2/token', 'grant_type=client_credentials&scope=' + scope, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + credentials
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching Kroger API token:', error);
    throw error;
  }
};

const getKrogerLocations = async (zip, krogerToken) => {
  try {
    const response = await axios.get(`https://api.kroger.com/v1/locations?filter.zipCode.near=${zip}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${krogerToken}`
      },
    });

    const locations = response.data.data.slice(0, 3).map(location => location.location.address.addressLine1);
    const locationsString = locations.join(', ');

    return locationsString;
  } catch (error) {
    console.error('Error fetching Kroger locations:', error);
    throw error;
  }
};

app.post('/getKrogerToken', async (req, res) => {
  console.log('Received POST from Glide for getKrogerToken');

  try {
    const krogerToken = await getKrogerToken();
    console.log('Kroger Token:', krogerToken);
    res.json({ krogerToken });
  } catch (error) {
    console.error('Error in getKrogerToken:', error);
    res.status(500).send({ error: 'Error fetching Kroger API token.' });
  }
});

app.post('/getKrogerLocations', async (req, res) => {
  console.log('Received POST from Glide for getKrogerLocations');

  const zip = req.body.params.zip.value;
  const krogerToken = req.body.params.krogerToken.value;

  try {
    const locationsString = await getKrogerLocations(zip, krogerToken);
    console.log('Locations String:', locationsString);
    res.json({ locations: locationsString });
  } catch (error) {
    console.error('Error in getKrogerLocations:', error);
    res.status(500).send({ error: 'Error fetching Kroger locations.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
