const winston = require('winston');
const LOG_LEVEL = ['error','warn','info','debug','silly', 'none'].indexOf(process.env.LOG_LEVEL) == -1 ? 'info' : process.env.LOG_LEVEL;

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  level: LOG_LEVEL,
  colorize: true,
  timestamp: true,
  prettyPrint: true,
  stringify: true
});
module.exports = winston;
