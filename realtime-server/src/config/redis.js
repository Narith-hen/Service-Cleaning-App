const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

const subscriber = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redis.on('connect', () => {
  console.log('✅ Redis connected (main)');
});

subscriber.on('connect', () => {
  console.log('✅ Redis connected (subscriber)');
});

redis.on('error', (error) => {
  console.error('❌ Redis main error:', error);
});

subscriber.on('error', (error) => {
  console.error('❌ Redis subscriber error:', error);
});

module.exports = {
  redis,
  subscriber
};