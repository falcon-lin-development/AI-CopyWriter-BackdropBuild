const logLevels = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
  };
  
  const log = (level: string, message: string, data: any = {}) => {
    const logEntry = {
      level,
      message,
      ...data
    };
    
    // Write to stdout or stderr based on log level
    const logString = JSON.stringify(logEntry);
    if (level === logLevels.ERROR) {
      process.stderr.write(logString + '\n');
    } else {
      process.stdout.write(logString + '\n');
    }
  };
  
  export const debug = (message: string, data: any = {}) => {
    log(logLevels.DEBUG, message, data);
  };
  
  export const info = (message: string, data: any = {}) => {
    log(logLevels.INFO, message, data);
  };
  
  export const warn = (message: string, data: any = {}) => {
    log(logLevels.WARN, message, data);
  };
  
  export const logError = (message: string, data: any = {}) => {
    log(logLevels.ERROR, message, data);
  };
  