import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Check authentication status and redirect accordingly
    if (this.authService.isAuthenticated()) {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin-approval']);
      } else {
        this.router.navigate(['/longlist']);
      }
    } else {
      this.router.navigate(['/login']);
    }
    
    return false; // Never allow access to the empty route
  }
} 