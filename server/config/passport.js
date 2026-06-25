// FILE: server/config/passport.js
const passport       = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const User           = require('../models/User')

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      // ── Extract fields from Google profile ──────────────────────────────────
      const googleId    = profile.id
      const email       = profile.emails?.[0]?.value?.toLowerCase()
      const displayName = profile.displayName || ''
      // Google avatar — request larger size by replacing s96-c with s400-c
      const avatar      = (profile.photos?.[0]?.value || '').replace('s96-c', 's400-c')

      if (!email) return done(new Error('No email from Google'), null)

      // ── Find existing user by googleId OR email ──────────────────────────────
      let user = await User.findOne({ $or: [{ googleId }, { email }] })

      if (user) {
        // Update Google fields if signing in with Google for first time on existing email account
        let changed = false
        if (!user.googleId)      { user.googleId      = googleId;    changed = true }
        if (!user.avatar && avatar) { user.avatar     = avatar;      changed = true }
        if (!user.displayName && displayName) { user.displayName = displayName; changed = true }
        if (user.authProvider !== 'google' && !user.password) {
          user.authProvider = 'google'; changed = true
        }
        if (changed) await user.save()
        return done(null, user)
      }

      // ── Create new user ──────────────────────────────────────────────────────
      // Generate a unique username from the display name
      const baseUsername = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')   // strip non-alphanumeric
        .substring(0, 20)
        || 'user'

      // Make sure username is unique by appending random suffix if needed
      let username = baseUsername
      const existing = await User.findOne({ username })
      if (existing) username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`

      user = await User.create({
        googleId,
        email,
        displayName,
        username,
        handle:       username,
        avatar,
        authProvider: 'google',
        password:     null,
        isEmailVerified: true,   // Google emails are pre-verified
      })

      return done(null, user)
    } catch (err) {
      console.error('[passport/google]', err)
      return done(err, null)
    }
  }
))

module.exports = passport