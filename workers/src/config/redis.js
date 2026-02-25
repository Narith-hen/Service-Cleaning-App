const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    console.log(`🔄 Retrying Redis connection... (attempt ${times})`);
    const delay = Math.min(times * 1000, 5000);
    return delay;
  },
  maxRetriesPerRequest: 5,
  lazyConnect: true // Don't connect immediately
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
  console.log('💡 Make sure Redis is running on localhost:6379');
  console.log('   Start Redis with: redis-server.exe');
});

module.exports = redis;