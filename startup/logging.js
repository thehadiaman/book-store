const {createLogger, format, transports} = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
    level: 'error',
    format: combine(
        format.colorize(),
        timestamp(),
        prettyPrint()
      ),
    transports: [
        new transports.File({
            filename: 'error.log',
            level: 'error'
        }),
        new transports.Console({
            level: 'info'
        })
    ],
});

module.exports = function(){
    logger.log({
        level: 'error',
        message: 'Error',
      });
};