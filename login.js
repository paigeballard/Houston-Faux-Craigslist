// const express = require('express')
// const app = express();
// const router = express.Router()
// const session = require('express-session')
// const passport = require('passport')
// const GitHubStrategy = require('passport-github').Strategy

// //Session config for Passport
// app.set('trust proxy', 1) // trust first proxy
// app.use(session({
//   secret: 'keyboard cat',
//   resave: false,
//   saveUninitialized: true
// }))

// //Initialize Passport
// app.use(passport.initialize());

// //Restore Session
// app.use(passport.session());

// //first time login succesfuly, user gets saved in session object
// passport.serializeUser(function(user, cb) {
//   console.log('serialized user', user)
//   cb(null, user);
// });

// //runs every time you go to new page durng session
// passport.deserializeUser(function(obj, cb) {
//   console.log('DEserialized user', obj)
//   cb(null, obj);
// });

// //GITHUB

// const GITHUB_CLIENT_ID = "Iv1.f25eb4f0b5f71402"
// const GITHUB_CLIENT_SECRET = "d677e4743f553cfe6499cfe09e5725aa39cd381a";

// passport.use(new GitHubStrategy({
//     // clientID: process.env.GITHUB_CLIENT_ID,
//     // clientSecret: process.env.GITHUB_CLIENT_SECRET,
//     clientID: GITHUB_CLIENT_ID,
//     clientSecret: GITHUB_CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/github/callback"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//       console.log('profile', profile)
//       //find or create a user document in the database
//       return cb(null, profile);
//   }
// ));

// //AUTH ROUTES

// router.get('/github',
//   passport.authenticate('github')
//   );  //redirects to github.com

// router.get('/github/callback',  //if successful, goes to cb url
//   passport.authenticate('github', { failureRedirect: '/login' , successRedirect: '/'}),
// );

// module.exports = router;
