const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express();
const port = 3000; 



const fs = require('fs')
const mustache = require('mustache')
const homepageTemplate = fs.readFileSync('./templates/homepage.mustache', 'utf8')

//home page
app.get('/', function (req, res) { 
  res.send(mustache.render(homepageTemplate))
})








app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})