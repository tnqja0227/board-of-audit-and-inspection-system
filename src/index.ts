import { createApp } from './app';
import logger from './config/winston';

const app = createApp();
app.listen(3000, () => {
    logger.info('Server started on port 3000');
});
