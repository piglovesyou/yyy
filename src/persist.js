// @flow

import bluebird from 'bluebird';
import redis from 'redis';

[redis.RedisClient.prototype, redis.Multi.prototype].forEach((proto) => {
  bluebird.promisifyAll(proto, {
    suffix: 'p',
  });
});


const persist = redis.createClient({
  host: process.env.REDIS_URL || undefined,
});

export default persist;
