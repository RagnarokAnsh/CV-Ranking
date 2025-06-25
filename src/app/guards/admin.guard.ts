import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      return true;
    }

    // Show unauthorized message
    this.messageService.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: 'You do not have permission to access this page. Admin access required.'
    });

    // Redirect to appropriate page
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/longlist']); // Redirect authenticated non-admin users
    } else {
      this.router.navigate(['/login']); // Redirect unauthenticated users
    }

    return false;
  }
} 