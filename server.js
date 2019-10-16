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

//app.use('/auth', login)  // access the auth routes in login.js 

app.get('/', function (req, res) {
  //res.send("This is the homepage template which will render and list all of the listings from the database.")
  res.send(mustache.render(homepageTemplate))
})

app.get('/login', function (req, res) {
  //res.send("This is the login page template.")

  res.send(mustache.render(loginTemplate))

})

app.get('/listings/:slug', function (req, res) {
  res.send("This is each listing displayed individually.")
})

app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})