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
            console.log('user already exists in DB')
          }
        })      
      return cb(null, profile);
  }
));




//Database Queries
function createUser(profile){
  let nameArr = profile.displayName.split(' ')
  return db.raw('INSERT INTO users (\"firstName\", \"lastName\") VALUES (?, ?)', [nameArr[0], nameArr[1]])
  //return db.raw('INSERT INTO users (\"firstName\", \"lastName\", \"email\") VALUES (?, ?, ?)', [nameArr[0], nameArr[1]], profile.emails[0].value)
}
function findUser(userObj){
  let nameArr = userObj.displayName.split(' ')
  return db.raw('SELECT * FROM users WHERE \"lastName\" = ?', [nameArr[1]])  //use email instead of last name
  .then(function(results) {
    return results
  })
}


function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      next();
  } else{
      res.redirect("/login");
  }
}

//AUTH ROUTES
app.get('/auth/github',
  passport.authenticate('github')
  );  //redirects to github.com

app.get('/auth/github/callback',  //if successful, goes to cb url
  passport.authenticate('github', { failureRedirect: '/login' , successRedirect: '/user'}),
 
);

app.get('/user', checkAuthentication, function (req, res){
      res.send('you are in the user page')
})
  
// -----------------------------------------------------------------------------





//templates
const homepageTemplate = fs.readFileSync('./templates/homepage.mustache', 'utf8')
const loginTemplate = fs.readFileSync('./templates/login.mustache', 'utf8')
const listingTemplate = fs.readFileSync('./templates/listing.mustache', 'utf8')

//app.use('/auth', login)  // access the auth routes in login.js 

app.get('/', function (req, res) {
  getAllListings()
  .then(function(allListings){
    const listings = []
    for (var i = 0; i < allListings.rows.length; i++) {
      let item = allListings.rows[i].sale_item
      let listing = allListings.rows[i].id
      let listItem = `<li style="font-size: 2.5em;"><a href="/listings/${listing}">${item}</a></li>`
      listings.push(listItem)
    }
    let wholeList = `<ul style="list-style: none;">${listings.join('')}</ul>`
    res.send(mustache.render(homepageTemplate, {listingsHTML: wholeList}))
})
})

app.get('/login', function (req, res) {

  res.send(mustache.render(loginTemplate))
})

app.get('/listings/:id', function (req, res) {
  console.log(req.params)
  getOneListing(req.params)
    .then(function (listing) {
      res.send(mustache.render(listingTemplate, {
        listingHTML: singleListing(listing)
      }))
    })
    .catch(function (err) {
      res.status(404).send('Listing Does Not Exist :(')
    })
})

app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})

// HTML Rendering

function singleListing (listing) {
  return `<li><a href="#">${listing.rows.sale_item}</a></li>
  <li><a href="#">${listings.rows.description}</a></li>
  <li><a href="#">${listings.rows.price}</a></li>`
}


// Database Queries

const getAllListingsQuery = `
  SELECT * 
  FROM sales
`

function getOneListing (listing) {
  return db.raw('SELECT * FROM sales WHERE id = ?', [listing])
  .then(function (results) {
    if (results.length !==1) {
      throw null
    } else {
      return results[0]
    }
  })
}

function getAllListings () {
  return db.raw(getAllListingsQuery)
}