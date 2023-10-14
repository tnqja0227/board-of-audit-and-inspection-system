import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

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
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            //
            // - Write all logs with importance level of `error` or less to `error.log`
            // - Write all logs with importance level of `info` or less to `combined.log`
            //
            new winston.transports.File({
                dirname: 'logs',
                filename: 'error.log',
                level: 'error',
            }),

            new winstonDaily({
                filename: 'trace-%DATE%.log',
                level: 'info',
                dirname: 'logs',
                datePattern: 'YYYY-MM-DD-HH',
                maxSize: '20m',
                maxFiles: '30d',
            }),
        ],
    });
}

export default logger;
