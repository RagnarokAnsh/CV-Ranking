import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionTimerService implements OnDestroy {
  private timerSubscription?: Subscription;
  private warningShown = false;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute
  private readonly WARNING_TIME = 5; // Show warning when 5 minutes left

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  startSessionTimer(): void {
    this.stopSessionTimer(); // Clear any existing timer
    
    console.log('Starting session timer...');
    
    this.timerSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkTokenExpiration();
    });
  }

  stopSessionTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.warningShown = false;
  }

  private checkTokenExpiration(): void {
    if (!this.authService.isAuthenticated()) {
      // Token is already expired or invalid
      this.handleSessionExpired();
      return;
    }

    const timeRemaining = this.authService.getTokenTimeRemaining();
    console.log(`Session time remaining: ${timeRemaining} minutes`);

    if (timeRemaining <= 0) {
      // Token has expired
      this.handleSessionExpired();
    } else if (timeRemaining <= this.WARNING_TIME && !this.warningShown) {
      // Show warning when 5 minutes or less remaining
      this.showExpirationWarning(timeRemaining);
    }
  }

  private handleSessionExpired(): void {
    console.log('Session expired - redirecting to login');
    this.stopSessionTimer();
    
    this.messageService.add({
      severity: 'warn',
      summary: 'Session Expired',
      detail: 'Your session has expired. Please login again.',
      life: 5000
    });
    
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showExpirationWarning(timeRemaining: number): void {
    this.warningShown = true;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Session Expiring Soon',
      detail: `Your session will expire in ${timeRemaining} minute(s). Save any work and refresh to extend your session.`,
      life: 10000
    });
  }

  // Method to refresh token expiration check manually
  checkNow(): void {
    this.checkTokenExpiration();
  }

  ngOnDestroy(): void {
    this.stopSessionTimer();
  }
} 