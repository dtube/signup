const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy;
const config = require('./config.js')
passport.use(new FacebookStrategy({
    clientID: config.fb.id,
    clientSecret: config.fb.secret,
    callbackURL: config.domain+"/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    db.collection('facebook').insertOne({
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
    })
    cb(null, {accessToken: accessToken})
  }
));
passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

module.exports = passport