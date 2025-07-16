import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor() { }

  log(message: any, ...args: any[]): void {
    if (environment.enableConsoleLogs) {
      console.log(message, ...args);
    }
  }

  error(message: any, ...args: any[]): void {
    if (environment.enableConsoleLogs) {
      console.error(message, ...args);
    }
    
    // In production, you might want to send errors to a logging service
    if (environment.production && environment.enableErrorTracking) {
      this.sendErrorToService(message, args);
    }
  }

  warn(message: any, ...args: any[]): void {
    if (environment.enableConsoleLogs) {
      console.warn(message, ...args);
    }
  }

  info(message: any, ...args: any[]): void {
    if (environment.enableConsoleLogs) {
      console.info(message, ...args);
    }
  }

  debug(message: any, ...args: any[]): void {
    if (environment.enableDebugMode) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  group(label: string): void {
    if (environment.enableConsoleLogs) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (environment.enableConsoleLogs) {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (environment.enableConsoleLogs) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (environment.enableConsoleLogs) {
      console.timeEnd(label);
    }
  }

  private sendErrorToService(message: any, args: any[]): void {
    // TODO: Implement error reporting service (e.g., Sentry, LogRocket, etc.)
    // This is where you would send errors to your monitoring service
    const errorData = {
      message: typeof message === 'string' ? message : JSON.stringify(message),
      args: args,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Example: Send to your error tracking service
    // this.http.post('/api/logs/error', errorData).subscribe();
  }

  // Performance monitoring
  measurePerformance<T>(label: string, fn: () => T): T {
    if (environment.enablePerformanceMonitoring) {
      this.time(label);
      const result = fn();
      this.timeEnd(label);
      return result;
    }
    return fn();
  }

  async measureAsyncPerformance<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (environment.enablePerformanceMonitoring) {
      this.time(label);
      const result = await fn();
      this.timeEnd(label);
      return result;
    }
    return fn();
  }
} 