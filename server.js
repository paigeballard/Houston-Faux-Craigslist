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


passport.serializeUser(function(user, cb) { //first time login succesfuly, user gets saved in session object
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) { //runs every time you go to new page durng session
   findUser(obj)
   .then(function(results){
    if(results.rows.length === 1){
      cb(null, obj)
    } else if(results.rows.length !== 1){
      cb(err, null);
    }
   })
  cb(null, obj);
});

//GITHUB Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback",
    scope: [ 'user:email' ]
  },
  function(accessToken, refreshToken, profile, cb) {
      findUser(profile)
        .then(function(results){
          if(results.rows.length === 0){
            createUser(profile)
              .then(function (results) {
                console.log('new user created')
              })
          } else {
            console.log('user already exists in DB', results)
          }
        })      
      return cb(null, profile);
  }
));

//FACEBOOK Strategy  
const FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name'] 
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log('facebook profile: ', profile)
      return cb(null, profile);
  }
));


//Database Queries
function createUser(profile){
  let email = profile._json.email
  let firstName;
  let lastName;

  if (profile._json.name){  //object structure for Github Strategy
    let fullName = profile._json.name.split(' ')
    firstName = nameArr[0]
    if (fullName.length > 2){lastName = nameArr[1] + '' +  nameArr[2]}
    else {lastName = nameArr[1]}
  } 
  else if (profile._json.first_name){
    firstName = profile._json.first_name
    lastName = profile._json.last_name
  }
  return db.raw('INSERT INTO users (\"firstName\", \"lastName\") VALUES (?, ?)', [firstName, lastName])
  //return db.raw('INSERT INTO users (\"firstName\", \"lastName\", email) VALUES (?, ?, ?)', [firstName, lastName, email])
}


function findUser(userObj){
  let nameArr = userObj._json.name.split(' ')
  return db.raw('SELECT * FROM users WHERE \"lastName\" = ?', [nameArr[1]])  
  // let email = obj._json.email
  // return db.raw('SELECT * FROM users WHERE email = ?', [email])  
}


function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      next();
  } else{
      res.redirect("/login");
  }
}

//AUTH ROUTES
app.get('/auth/github', passport.authenticate('github'));  //redirects to github.com

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' , successRedirect: '/user'}),);

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email']}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' , successRedirect: '/user'}),
);

app.get('/user', checkAuthentication, function (req, res){
      res.send('you are in the user page')
})
  
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

function renderListing (listing) {
  return `<li><a href="#">${allListings.rows.sale_item}</a></li>`
}

function renderAllListings (allListings) {
  return '<ul>' + allListings.map(renderListing).join('') + '</ul>'
}

// Database Queries

const getAllListingsQuery = `
  SELECT sale_item 
  FROM sales
`

function getAllListings () {
  return db.raw(getAllListingsQuery)
}