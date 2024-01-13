import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

let logger: winston.Logger;

const consoleFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `[${level}] ${timestamp}: ${message}`;
});

if (process.env.NODE_ENV !== 'production') {
    logger = winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            consoleFormat,
        ),
        transports: [new winston.transports.Console()],
    });
} else {
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.json(),
        ),
        defaultMeta: { service: 'bai' },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    consoleFormat,
                ),
            }),
            new DailyRotateFile({
                filename: 'trace-%DATE%.log',
                level: 'info',
                dirname: path.join(__dirname, '../../logs'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '30d',
            }),
        ],
    });
}
logger.info('logger initialized');

export default logger;
