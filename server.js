const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express();
const port = 3000; 



const fs = require('fs')
const mustache = require('mustache')
const homepageTemplate = fs.readFileSync('./templates/homepage.mustache', 'utf8')


app.get('/', function (req, res) {
  //res.send("This is the homepage template which will render and list all of the listings from the database.")
  res.send(mustache.render(homepageTemplate))
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