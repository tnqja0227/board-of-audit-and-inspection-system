import { createClient } from 'redis';
import logger from '../config/winston';

let client;
if (process.env.NODE_ENV !== 'production') {
    client = createClient({ url: 'redis://localhost:6379' });
} else {
    client = createClient({ url: 'redis://redis:6379' });
}

client.on('error', (err) => logger.error('Redis Client Error', err));
client
    .connect()
    .then(() => {
        logger.info('Connected to Redis');
    })
    .catch(logger.error);

export const redisClient = client;
