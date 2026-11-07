const formatTime = () => new Date().toISOString();

export const logger = {
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[90m[${formatTime()}] [DEBUG]\x1b[0m`, ...args);
    }
  },
  info: (...args) => {
    console.log(`\x1b[36m[${formatTime()}] [INFO]\x1b[0m`, ...args);
  },
  warn: (...args) => {
    console.warn(`\x1b[33m[${formatTime()}] [WARN]\x1b[0m`, ...args);
  },
  error: (...args) => {
    console.error(`\x1b[31m[${formatTime()}] [ERROR]\x1b[0m`, ...args);
  },
  success: (...args) => {
    console.log(`\x1b[32m[${formatTime()}] [SUCCESS]\x1b[0m`, ...args);
  },
};

export default logger;
