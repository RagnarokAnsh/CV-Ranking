import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      return true; // Allow access if user is not authenticated
    }

    // Redirect authenticated users to appropriate page
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin-approval']);
    } else {
      this.router.navigate(['/longlist']);
    }
    
    return false;
  }
} 