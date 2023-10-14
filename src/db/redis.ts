import { createClient } from 'redis';
import logger from '../config/winston';

const client = createClient();

client.on('error', (err) => logger.error('Redis Client Error', err));
client.connect().catch(logger.error);

export const redisClient = client;
