type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

const formatLog = (level: LogLevel, message: string, data?: any): string => {
  const timestamp = new Date().toISOString();
  let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data !== undefined) {
    log += ` ${typeof data === 'object' ? JSON.stringify(data) : data}`;
  }
  return log;
};

export const logger = {
  info: (message: string, data?: any) => {
    console.log(formatLog('info', message, data));
  },
  
  warn: (message: string, data?: any) => {
    console.warn(formatLog('warn', message, data));
  },
  
  error: (message: string, data?: any) => {
    console.error(formatLog('error', message, data));
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog('debug', message, data));
    }
  }
};
