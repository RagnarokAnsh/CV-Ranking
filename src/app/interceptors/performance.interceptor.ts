import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConsoleService } from '../services/console.service';

export const performanceInterceptor: HttpInterceptorFn = (req, next) => {
  const consoleService = inject(ConsoleService);
  const startTime = performance.now();
  const requestStart = Date.now();

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Log performance metrics in development
        if (environment.enableConsoleLog) {
          consoleService.log(`[HTTP] ${req.method} ${req.url}`, {
            duration: `${duration.toFixed(2)}ms`,
            status: event.status,
            size: event.body ? JSON.stringify(event.body).length : 0
          });
        }
        
        // In production, you could send this to monitoring service
        if (environment.production && duration > 5000) { // Log slow requests (>5s)
          // Send to monitoring service (CloudWatch, etc.)
          const performanceData = {
            url: req.url,
            method: req.method,
            duration,
            status: event.status,
            timestamp: requestStart
          };
          
          // TODO: Send to monitoring service
          consoleService.reportError(
            new Error(`Slow request detected: ${duration}ms`),
            JSON.stringify(performanceData)
          );
        }
      }
    }),
    catchError(error => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Track failed requests
      const errorData = {
        url: req.url,
        method: req.method,
        duration,
        status: error.status,
        error: error.message,
        timestamp: requestStart
      };
      
      if (environment.production) {
        consoleService.reportError(error, JSON.stringify(errorData));
      } else {
        consoleService.error('[HTTP Error]', errorData);
      }
      
      return throwError(() => error);
    })
  );
};