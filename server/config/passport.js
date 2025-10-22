const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const { query } = require('./database');
const logger = require('../utils/logger');

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fine_jwt_secret_key_2024'
}, async (payload, done) => {
  try {
    const user = await query(
      'SELECT id, email, name, avatar_url, onboarding_completed FROM users WHERE id = ?',
      [payload.userId]
    );
    
    if (user.length > 0) {
      return done(null, user[0]);
    }
    
    return done(null, false);
  } catch (error) {
    logger.error('JWT Strategy error:', error);
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT * FROM users WHERE google_id = ? OR email = ?',
        [profile.id, profile.emails[0].value]
      );

      if (existingUser.length > 0) {
        // Update Google ID if not set
        if (!existingUser[0].google_id) {
          await query(
            'UPDATE users SET google_id = ? WHERE id = ?',
            [profile.id, existingUser[0].id]
          );
        }
        return done(null, existingUser[0]);
      }

      // Create new user
      const newUser = await query(
        'INSERT INTO users (google_id, email, name, avatar_url, email_verified, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          profile.id,
          profile.emails[0].value,
          profile.displayName,
          profile.photos[0]?.value || null,
          true
        ]
      );

      const user = await query(
        'SELECT * FROM users WHERE id = ?',
        [newUser.insertId]
      );

      return done(null, user[0]);
    } catch (error) {
      logger.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'picture']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT * FROM users WHERE facebook_id = ? OR email = ?',
        [profile.id, profile.emails[0].value]
      );

      if (existingUser.length > 0) {
        // Update Facebook ID if not set
        if (!existingUser[0].facebook_id) {
          await query(
            'UPDATE users SET facebook_id = ? WHERE id = ?',
            [profile.id, existingUser[0].id]
          );
        }
        return done(null, existingUser[0]);
      }

      // Create new user
      const newUser = await query(
        'INSERT INTO users (facebook_id, email, name, avatar_url, email_verified, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          profile.id,
          profile.emails[0].value,
          `${profile.name.givenName} ${profile.name.familyName}`,
          profile.photos[0]?.value || null,
          true
        ]
      );

      const user = await query(
        'SELECT * FROM users WHERE id = ?',
        [newUser.insertId]
      );

      return done(null, user[0]);
    } catch (error) {
      logger.error('Facebook OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await query(
      'SELECT id, email, name, avatar_url, onboarding_completed FROM users WHERE id = ?',
      [id]
    );
    done(null, user[0] || null);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

module.exports = passport;
