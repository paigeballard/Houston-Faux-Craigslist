const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express();
const port = 3000; 
const login = require('./login.js')     //for login
const fs = require('fs')                //for templating
const mustache = require('mustache')    //for templating


// -----------------------------------------------------------------------------
// OAuthorization
require('dotenv').config() //to hide keys

const session = require('express-session')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy



app.set('trust proxy', 1) // trust first proxy
app.use(session({         //session config for Passport
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))
app.use(passport.initialize()); //initialize Passport module
app.use(passport.session()); //restore session


//first time login succesfuly, user gets saved in session object
passport.serializeUser(function(user, cb) {
  console.log('serialized user', user)
  cb(null, user);
});

//runs every time you go to new page durng session
passport.deserializeUser(function(obj, cb) {
  console.log('DEserialized user', obj)
  cb(null, obj);
});

//GITHUB
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log('accessToken',accessToken, 'refreshToken', refreshToken,  'profile', profile)
      //find or create a user document in the database
      return cb(null, profile);
  }
));


//AUTH ROUTES
app.get('/auth/github',
  passport.authenticate('github')
  );  //redirects to github.com

app.get('/auth/github/callback',  //if successful, goes to cb url
  passport.authenticate('github', { failureRedirect: '/login' , successRedirect: '/'}),
);


// -----------------------------------------------------------------------------





//templates
const homepageTemplate = fs.readFileSync('./templates/homepage.mustache', 'utf8')
const loginTemplate = fs.readFileSync('./templates/login.mustache', 'utf8')

//app.use('/auth', login)  // access the auth routes in login.js 

app.get('/', function (req, res) {
  getAllListings()
  .then(function(allListings){
    const listings = []
    for (var i = 0; i < allListings.rows.length; i++) {
      let item = allListings.rows[i].sale_item
      let listItem = `<li><a href="">${item}</a></li>`
      listings.push(listItem)
    }
    let wholeList = `<ul style="list-style: none;">${listings.join('')}</ul>`
    res.send(mustache.render(homepageTemplate, {listingsHTML: wholeList}))
})
})

app.get('/login', function (req, res) {
  //res.send("This is the login page template.")
  res.send(mustache.render(loginTemplate))
})

app.get('/listings', function (req, res) {
  getAllListings()
  .then(function(allListings){
    const listings = []
    for (var i = 0; i < allListings.rows.length; i++) {
      let item = allListings.rows[i].sale_item
      let listItem = `<li><a href="">${item}</a></li>`
      listings.push(listItem)
    }
    let wholeList = `<ul style="list-style: none;">${listings.join('')}</ul>`
    res.send(wholeList)
})
})

app.get('/listings/:slug', function (req, res) {
  res.send("This is each listing displayed individually.")
})

app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})

// HTML Rendering

// function renderListing (listing) {
//   return `<li><a href="#">${allListings.rows.sale_item}</a></li>`
// }

// function renderAllListings (allListings) {
//   return '<ul>' + allListings.map(renderListing).join('') + '</ul>'
// }

// Database Queries

const getAllListingsQuery = `
  SELECT sale_item 
  FROM sales
`

function getAllListings () {
  return db.raw(getAllListingsQuery)
}