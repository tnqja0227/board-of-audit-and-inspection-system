import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import logger from '../config/winston';

const url =
    process.env.NODE_ENV === 'production'
        ? 'redis://redis:6379'
        : 'redis://localhost:6379';

const redisClient = createClient({ url });
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect().catch((err) => {
    logger.error('Unable to connect to the Redis database:');
    throw err;
});

const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'BAI:',
    ttl: 86400,
});

export { redisClient, redisStore };
