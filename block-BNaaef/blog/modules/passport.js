var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;

var User = require('../models/User');

// github
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:2000/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, cb) => {
      var profileData = {
        name: profile._json.name,
        username: profile.username,
        email: profile.emails[0].value,
      };
      try {
        console.log('profile data', profileData);
        const user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          const addedUser = await User.create(profileData);
          return cb(null, addedUser);
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

// google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://www.example.com/auth/google/callback',
      scope: ['profile'],
    },
    async (accessToken, refreshToken, profile, cb) => {
      var Data = {
        email: profile.emails[0].value,
      };
      try {
        console.log('profile data', Data);
        const user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          const addedUser = await User.create(Data);
          return cb(null, addedUser);
        }
        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
