/**
 * Logger structuré (Winston)
 */

const winston = require('winston');
const config = require('../../config');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: config.isProduction()
      ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
      : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}] ${info.message}`
            + (info.meta ? ` ${JSON.stringify(info.meta)}` : '')
        )
      ),
  }),
];

// Fichiers de log en production
if (config.isProduction()) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
    })
  );
}

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format,
  transports,
});

module.exports = logger;
