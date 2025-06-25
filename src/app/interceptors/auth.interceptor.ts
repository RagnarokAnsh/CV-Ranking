import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
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
        console.log('JWT token expired or invalid - logging out user');
        
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
      }
      
      return throwError(() => error);
    })
  );
}; 