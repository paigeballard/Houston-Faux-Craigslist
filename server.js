const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express();

const port = 3000; 

app.listen(port, function () {
    console.log('Listening on port ' + port + ' 👍')
  })