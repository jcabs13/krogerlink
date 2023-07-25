app.post('/webhook', (req, res) => {
    console.log('Received POST from Glide');
    
    const token = process.env.BEARER_TOKEN;
  
    // Extract rowID from incoming request
    const glideRowId = req.body.rowID;
  
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
            // Use rowID from the request
            "rowID": glideRowId 
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
  