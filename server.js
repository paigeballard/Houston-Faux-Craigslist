const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express();

const port = 3000; 

app.get('/', function (req, res) {
  res.send("This is the homepage template which will render and list all of the listings from the database.")
})

app.get('/login', function (req, res) {
  res.send("This is the login page template.")
})

app.get('/listings/:slug', function (req, res) {
  res.send("This is each listing displayed individually.")
})

app.listen(port, function () {
    console.log('Listening on port ' + port + ' 👍')
  })