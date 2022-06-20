'use strict';
const express = require('express');
const app = express();
const port = 8080;

app.use(express.static(__dirname));

app.get('/',function(req,res) {
    res.sendFile('index.html', { root: __dirname });
  });

app.listen(port, () => {
  console.log(`2DGarden listening on port ${port}`)
});

