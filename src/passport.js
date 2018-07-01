// @flow

import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import persist from './persist';
import config from './config';
import type { TwitterProfile } from './types/twitter';
import type { UserType } from './types/index';

passport.serializeUser((user:UserType, done) => {
  const json = JSON.stringify(user);
  persist.setAsync(`user:${user._id}`, json).catch(done).then(() => {
    done(null, user._id);
  });
});

passport.deserializeUser(async (id, done) => {
  const json = await persist.getAsync(`user:${id}`);
  done(null, (JSON.parse(json)));
});

passport.use('twitter', new TwitterStrategy({
  consumerKey: config.auth.twitter.key,
  consumerSecret: config.auth.twitter.secret,
  callbackURL: config.auth.twitter.callbackOrigin + '/login/twitter/callback',
}, (token, tokenSecret, profile: TwitterProfile, cb) => {
  const user: UserType = {
    _id: String(profile.id),
    name: profile.displayName,
    image: profile.photos[0].value,
    provider: 'twitter',
  };
  cb(null, user);
}));

export default passport;
