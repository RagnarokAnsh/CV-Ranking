import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Show unauthorized message
    this.messageService.add({
      severity: 'warn',
      summary: 'Authentication Required',
      detail: 'Please log in to access this page.'
    });

    // Redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
} 