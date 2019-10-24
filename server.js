const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express()
const port = 3000
const fs = require('fs')                // for templating
const mustache = require('mustache')    // for templating
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.urlencoded())
app.use(express.static(__dirname + '/public'))

// OAuthorization ----------------------------------------------------------------------- //
require('dotenv').config() // to hide keys

const session = require('express-session')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy

app.set('trust proxy', 1) // trust first proxy
app.use(session({         // session config for Passport
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize()) //  initialize Passport module
app.use(passport.session()) // restore session

// *store session into database *//

passport.serializeUser(function (user, cb) { // first time login succesfuly, user gets saved in session object
  cb(null, user)
})

passport.deserializeUser(function (obj, cb) { // runs every time you go to new page during session
  findUser(obj)
    .then(function (results, err) { // findUser returns an object {id:'id', firstName: 'first name',  lastName: 'last ',  email: 'email' }
      cb(null, results)      
    })
    .catch(function (err) { 
      return cb(err, null)
    })
  // cb(null, obj);
})

// GITHUB Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/github/callback',
  scope: ['user:email']
},
function (accessToken, refreshToken, profile, cb) {
  createUser(profile)
    .then(function (value) {
      if (value.name === 'error') { console.log( 'user already exists in database, no need to add') }
      else { console.log('new user created in database') }
    })      
  return cb(null, profile)
}

))

// FACEBOOK Strategy

const FacebookStrategy = require('passport-facebook').Strategy

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name']
},
function (accessToken, refreshToken, profile, cb) {
  createUser(profile)
    .then(function (value) {
      console.log('fb strategy:', value)
      if (value.name === 'error') { console.log('user already exists in database, no need to add')}
      else { console.log('new user created in database') }
    })       
  return cb(null, profile)
}

))

function checkAuthentication (req, res, next) {
  if (req.isAuthenticated()) {
    next()
  } else {
    res.redirect('/login')
  }
}

// TEMPLATES ----------------------------------------------------------------------- //
const homepageTemplate = fs.readFileSync('./templates/homepage.mustache', 'utf8')
const loginTemplate = fs.readFileSync('./templates/login.mustache', 'utf8')
const listingTemplate = fs.readFileSync('./templates/listing.mustache', 'utf8')
const userTemplate = fs.readFileSync('./templates/user.mustache', 'utf8')
const listingFormTemplate = fs.readFileSync('./templates/listing-form.mustache', 'utf8')
const CG = require('./craigslistData.js') 

// ROUTES ----------------------------------------------------------------------- //

app.get('/', function (req, res) {
  getAllListings()
    .then(function (allListings) {
      completeRenderHomepage(allListings, res)
    })
})

app.get('/auth/github', passport.authenticate('github'))   // redirects to github.com

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login', successRedirect: '/user' }))

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }))

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' , successRedirect: '/user' })
)

app.get('/login', function (req, res) {
  res.send(mustache.render(loginTemplate))
})

app.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

app.get('/user', checkAuthentication, function (req, res) {
  let userFullName = `${req.user.firstName} ${req.user.lastName}`
  // res.send(mustache.render(userTemplate))
  // console.log(listingById)
  console.log(req.user)
  let user = req.user.id 
  getUserListings(user)
    .then(function (results) {
      console.log('results', results)
      var userListing = `
       <a href="/listing/${results.rows[0].id}"><li>${results.rows[0].sale_item}</li></a>
       `
      res.send(mustache.render(userTemplate, { userListingHTML: userListing }))
    })
  res.send(mustache.render(userTemplate, { userName: userFullName }))
})   
function getUserListings (id) {
  return db.raw('SELECT * FROM sales WHERE user_id = ?', [id])
}

app.get('/listing/:id', function (req, res) {
  getOneListing(req.params)
    .then(function (listing) {
      res.send(mustache.render(listingTemplate, { listingHTML: singleListing(listing)
      }))
    })
    .catch(function (err) {
        res.status(404).send('Listing Does Not Exist :(')
})
})

app.get('/newlisting', checkAuthentication, function (req, res) {
  let user = `${req.user.firstName} ${req.user.lastName}`
  res.send(mustache.render(listingFormTemplate, { userName: user }))
})

app.post('/newlisting', function (req, res) {
  console.log('req.user', req.user)
  let userId = req.user.id    
  console.log('req.user.id', req.user.id)                
  addListing(req.body, userId)    
    .then(function (results) { 
      if (results) { res.send('new listing made') }
      else { res.send('something went wrong') }
    })  
})

app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})

function completeRenderHomepage (allListings, res) {
  const listings = renderAllListings(allListings)
  let wholeList = `<ul class="d-flex flex-column-reverse list-unstyled" >${listings.join('')}</ul>`
  res.send(mustache.render(homepageTemplate, { listingsHTML: wholeList, days: CG.calendar.days, resources: CG.userResources, about: CG.aboutCraigslist, cities: CG.cities, week1: CG.calendar.weeks.w1, week2: CG.calendar.weeks.w2, week3: CG.calendar.weeks.w3, week4: CG.calendar.weeks.w4}));
}

function renderAllListings (allListings) {
  // first page needs to be converted to a number
  // then use page in the for loop to get the targeted 25 listings
  // finally, previous and next links need to be added to the html.  how to use page number to make those.
  const listings = []
  for (var i = 0; i < allListings.rows.length; i++) {
    let item = allListings.rows[i].sale_item
    let price = allListings.rows[i].price
    let listing = allListings.rows[i].id
    let createdDate = allListings.rows[i].created_at
    let thumbnail = allListings.rows[i].img
    let listItem = `<li class="price">$${price}</li>
                      <li style="font-size: 1em;"><a href="/listing/${listing}">
                      <img class="border rounded"src="${thumbnail}"/><span class="text-secondary d-inline-block text-truncate" style="font-size:11px; max-width:102px;">${createdDate}</span> ${item}</a></li>
      `
    listings.push(listItem)
  }
  return listings
}

// HTML Rendering ----------------------------------------------------------------------- //

function singleListing (listing) {
  console.log('this is the', listing)
  return `<h2>${listing.sale_item} - $ ${listing.price}</h2>
          <img src="${listing.img}"/>
          <p>${listing.description}</p>
          <br>
          <br>
          <p>Posted by: ${listing.id} user`
}

function listingById (listing) {
  const listingId = parseInt(listing.id)
  return db.raw('SELECT * FROM sales WHERE user_id = ?', [listingId])
    .then(function (result) {  
}) 
}
console.log(listingById)

// Database Queries ----------------------------------------------------------------------- //

const getAllListingsQuery = `
  SELECT * 
  FROM sales
`

function getOneListing (listing) {
  const listingId = parseInt(listing.id)
  return db.raw('SELECT * FROM sales WHERE id = ?', [listingId])
    .then(function (results) {
    // if (results.length !==1) {
    //   throw null
    // } else {

      console.log(results.rows[0])
      return results.rows[0]
})
}

function getAllListings () {
  return db.raw(getAllListingsQuery)
}

function findUser (userObj) {
  let email = userObj._json.email
  // console.log('email:', email)
  return db.raw('SELECT * FROM users WHERE email = ?', [email])  
    .then(function (results) {
      if (results.rows.length === 0) { throw 'error: user not in database' }
      else { return results.rows[0] }
})  
}

function createUser (profile) {
  let email = profile._json.email
  let firstName
  let lastName

  if (profile._json.name) { // object structure for Github Strategy
    let fullName = profile._json.name.split(' ')
    firstName = fullName[0]
    if (fullName.length > 2) { lastName = fullName[1] + '' +  fullName[2] }
    else { lastName = fullName[1] }
  } 
  else if (profile._json.first_name) { // object structure for Facebook Strategy
    firstName = profile._json.first_name
    lastName = profile._json.last_name
  }
 return db.raw('INSERT INTO users (\"firstName\", \"lastName\", email) VALUES (?, ?, ?)', [firstName, lastName, email], 'ON CONFLICT (email) DO NOTHING')
    .then(function (results) {
      return results
    })
    .catch(function (error) {
      return error
    })
}

function addListing (formData, id) {
  const title = formData.listingTitle
  const price = formData.listingPrice
  const description = formData.listingDescription
  const userid = id
  return db.raw(`
    INSERT INTO sales (sale_item, price, description, user_id, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  [title, price, description, userid])
}