const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)
const express = require('express')
const app = express()
const port = 3000
const fs = require('fs') // for templating
const mustache = require('mustache') // for templating

const bodyParser = require('body-parser')
const CG = require('./craigslistData.js')
const queries = require('./db/queries')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.urlencoded())

// OAuthorization ----------------------------------------------------------------------- //
require('dotenv').config() // to hide keys

const session = require('express-session')
const passport = require('passport')
const GitHubStrategy = require('passport-github').Strategy

app.set('trust proxy', 1) // trust first proxy
app.use(session({ // session config for Passport

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
      if (value.name === 'error') { console.log('user already exists in database, no need to add') } else { console.log('new user created in database') }
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
      if (value.name === 'error') { console.log('user already exists in database, no need to add') } else { console.log('new user created in database') }
    })
  return cb(null, profile)
}))

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

// ROUTES ----------------------------------------------------------------------- //

app.get('/', function (req, res) {
  getAllListings()
    .then(function (allListings) {
      completeRenderHomepage(allListings, res)
    })
})

app.get('/auth/github', passport.authenticate('github')) // redirects to github.com

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login', successRedirect: '/user' }))

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }))

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', successRedirect: '/user' })

)

app.get('/login', function (req, res) {
  res.send(mustache.render(loginTemplate))
})

app.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

app.get('/user', checkAuthentication, function (req, res) {
  const userFullName = `${req.user.firstName} ${req.user.lastName}`
  const userID = req.user.id
  getUserListings(userID)
    .then(function (results) {
      const userlistingArr = results.rows
      const userAllListings = []
      const userAllListingCount = results.rows.length
      userlistingArr.forEach(listing => {
        const userListing = `<a href="/listing/${listing.id}"><li>${listing.sale_item}</li></a>`
        userAllListings.push(userListing)
      })
      res.send(mustache.render(userTemplate, { userListingHTML: userAllListings.join(''), userName: userFullName, userFirstName: req.user.firstName, postingNum: userAllListingCount }))
    })
})

app.get('/listing/:id', function (req, res) {
  getOneListing(req.params)
    .then(function (listing) {
      res.send(mustache.render(listingTemplate, { listingHTML: singleListing(listing) }))
    })
    .catch(function (err) {
      res.status(err).send('There are no more listings.  <a href="/">Click Here</a> to go back to homepage')
    })
})

app.get('/newlisting', checkAuthentication, function (req, res) {
  const user = `${req.user.firstName} ${req.user.lastName}`

  res.send(mustache.render(listingFormTemplate, { userName: user }))
})

app.post('/newlisting', function (req, res) {
  // console.log('req.user', req.user)

  const userId = req.user.id
  // console.log('req.user.id', req.user.id)
  addListing(req.body, userId)
    .then(function (results) {
      if (results) { res.redirect('/user') } else { res.send('something went wrong') }
    })
})

app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})

function completeRenderHomepage (allListings, res) {
  const listings = renderAllListings(allListings)
  const wholeList = `<ul class="d-flex flex-column-reverse list-unstyled" >${listings.join('')}</ul>`

  res.send(mustache.render(homepageTemplate, { listingsHTML: wholeList, days: CG.calendar.days, resources: CG.userResources, about: CG.aboutCraigslist, cities: CG.cities, week1: CG.calendar.weeks.w1, week2: CG.calendar.weeks.w2, week3: CG.calendar.weeks.w3, week4: CG.calendar.weeks.w4 }))
}

function renderAllListings (allListings) {
  // first page needs to be converted to a number
  // then use page in the for loop to get the targeted 25 listings
  // finally, previous and next links need to be added to the html.  how to use page number to make those.
  const listings = []
  for (var i = 0; i < allListings.rows.length; i++) {
    const item = allListings.rows[i].sale_item
    const price = allListings.rows[i].price
    const listing = allListings.rows[i].id
    const createdDate = allListings.rows[i].created_at.toDateString()
    const thumbnail = allListings.rows[i].img
    const listItem = `
    <table class="table">
      <tr>
        <td style="width:10%;"><img class="border rounded" src="${thumbnail}"/></td>
        <td style="width:20%;"><span class="text-secondary" style="font-size:11px; max-width:102px;">${createdDate}</span><br />$ ${price}</td>
        <td><a href="/listing/${listing}">${item}</a></td>
      </tr>
    </table>

      `
    listings.push(listItem)
  }
  return listings
}

// HTML Rendering ----------------------------------------------------------------------- //

function singleListing (listing) {
  console.log('this is the', listing)

  return `
          <div class="d-flex justify-content-center buttons container">
            <a href="${listing.id - 1}" id="prev"> prev </a>
            <a href="${listing.id + 1}" id="next"> next </a>
          </div>
          <h2>${listing.sale_item} - $ ${listing.price}</h2>
          <img src="${listing.img}"/>
          <p>${listing.description}</p>
          <br>
          <br>
          <p>Posted on: ${listing.created_at.toDateString()}`
}

function listingById (listing) {
  const listingId = parseInt(listing.id)
  return db.raw('SELECT * FROM sales WHERE user_id = ?', [listingId])
    .then(function (result) {
    })
}
console.log(listingById)

// Database Queries ----------------------------------------------------------------------- //



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
  return db.raw(queries.getAllListingsQuery)
}

function getUserListings (id) {
  return db.raw('SELECT * FROM sales WHERE user_id = ?', [id])
}

function findUser (userObj) {
  const email = userObj._json.email
  // console.log('email:', email)
  return db.raw('SELECT * FROM users WHERE email = ?', [email])
    .then(function (results) {
      if (results.rows.length === 0) { throw 'error: user not in database' } else { return results.rows[0] } //eslint-disable-line
    })
}

function createUser (profile) {
  const email = profile._json.email

  let firstName
  let lastName

  if (profile._json.name) { // object structure for Github Strategy
    const fullName = profile._json.name.split(' ')
    firstName = fullName[0]
    if (fullName.length > 2) { lastName = fullName[1] + '' + fullName[2] } else { lastName = fullName[1] }
  } else if (profile._json.first_name) { // object structure for Facebook Strategy
    firstName = profile._json.first_name
    lastName = profile._json.last_name
  }
  return db.raw('INSERT INTO users (\"firstName\", \"lastName\", email) VALUES (?, ?, ?)', [firstName, lastName, email], 'ON CONFLICT (email) DO NOTHING')  //eslint-disable-line
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
  const listimgImg = 'https://loremflickr.com/320/240'
  return db.raw(`
    INSERT INTO sales (sale_item, price, description, user_id, created_at, img)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
  [title, price, description, userid, listimgImg])
}
