// @flow

import bluebird from 'bluebird';
import redis from 'redis';

[redis.RedisClient.prototype, redis.Multi.prototype].forEach((proto) => {
  bluebird.promisifyAll(proto, {
    suffix: 'p',
  });
});

const persist = redis.createClient(process.env.REDIS_URL || undefined);

persist.on('connect', () => console.log('Redis connected'));
persist.on('error', () => console.error('Redis connection fails'));

export default persist;
