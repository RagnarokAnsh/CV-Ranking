import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, timeout } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if the error is due to token expiration (401 Unauthorized)
      if (error.status === 401) {
        // Show session expired message
        messageService.add({
          severity: 'warn',
          summary: 'Session Expired',
          detail: 'Your session has expired. Please login again.',
          life: 5000
        });
        
        // Clear user session
        authService.logout();
        
        // Redirect to login page
        router.navigate(['/login']);
      } else if (error.status === 0 && error.statusText === 'Unknown Error') {
        messageService.add({
          severity: 'error',
          summary: 'Network Error',
          detail: 'Request failed. Please check your connection and try again.',
          life: 5000
        });
      }
      
      return throwError(() => error);
    })
  );
}; 