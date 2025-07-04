import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  
  log(...args: any[]): void {
    if (environment.enableConsoleLog) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (environment.enableConsoleLog) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    if (environment.enableConsoleLog) {
      console.error(...args);
    }
  }

  info(...args: any[]): void {
    if (environment.enableConsoleLog) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (environment.enableConsoleLog) {
      console.debug(...args);
    }
  }

  group(label?: string): void {
    if (environment.enableConsoleLog) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (environment.enableConsoleLog) {
      console.groupEnd();
    }
  }

  table(data: any): void {
    if (environment.enableConsoleLog) {
      console.table(data);
    }
  }

  time(label?: string): void {
    if (environment.enableConsoleLog) {
      console.time(label);
    }
  }

  timeEnd(label?: string): void {
    if (environment.enableConsoleLog) {
      console.timeEnd(label);
    }
  }

  // For production error reporting
  reportError(error: any, context?: string): void {
    if (environment.enableErrorReporting) {
      // In production, this would send to error tracking service
      // For now, we'll use a structured approach
      const errorReport = {
        timestamp: new Date().toISOString(),
        error: error.message || error,
        stack: error.stack,
        context: context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // TODO: Send to error reporting service (e.g., Sentry, CloudWatch)
      if (environment.enableConsoleLog) {
        console.error('Error Report:', errorReport);
      }
    }
  }
}