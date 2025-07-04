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
  private readonly CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds for more responsive warnings
  private readonly WARNING_TIME = 5; // Show warning when 5 minutes left

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  startSessionTimer(): void {
    this.stopSessionTimer(); // Clear any existing timer
    this.warningShown = false; // Reset warning state
    
    console.log('Starting session timer...');
    
    // Check immediately when starting
    this.checkTokenExpiration();
    
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
    console.log('Session timer stopped');
  }

  private checkTokenExpiration(): void {
    if (!this.authService.isAuthenticated()) {
      // Token is already expired or invalid
      console.log('Token not authenticated, stopping timer');
      this.handleSessionExpired();
      return;
    }

    const timeRemaining = this.authService.getTokenTimeRemaining();
    console.log(`Session time remaining: ${timeRemaining} minutes`);

    if (timeRemaining <= 0) {
      // Token has expired
      console.log('Token expired, handling session expiry');
      this.handleSessionExpired();
    } else if (timeRemaining <= this.WARNING_TIME && !this.warningShown) {
      // Show warning when 5 minutes or less remaining
      console.log(`Showing expiration warning - ${timeRemaining} minutes remaining`);
      this.showExpirationWarning(timeRemaining);
    } else if (timeRemaining > this.WARNING_TIME && this.warningShown) {
      // Reset warning if time increased (token refreshed)
      console.log('Time increased, resetting warning state');
      this.warningShown = false;
    }
  }

  private handleSessionExpired(): void {
    console.log('Session expired - redirecting to login');
    this.stopSessionTimer();
    
    // Only show toast if we're not already on the login page
    if (!this.router.url.includes('/login')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Session Expired',
        detail: 'Your session has expired. Please login again.',
        life: 5000
      });
    }
    
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showExpirationWarning(timeRemaining: number): void {
    this.warningShown = true;
    
    const minutes = timeRemaining === 1 ? 'minute' : 'minutes';
    this.messageService.add({
      severity: 'warn',
      summary: 'Session Expiring Soon',
      detail: `Your session will expire in ${timeRemaining} ${minutes}. Save any work and refresh to extend your session.`,
      life: 10000,
      sticky: true
    });
    
    console.log(`Warning shown for ${timeRemaining} minutes remaining`);
  }

  // Method to refresh token expiration check manually
  checkNow(): void {
    console.log('Manual session check triggered');
    this.checkTokenExpiration();
  }

  // Method to reset warning state (can be called after token refresh)
  resetWarning(): void {
    console.log('Warning state reset');
    this.warningShown = false;
  }



  ngOnDestroy(): void {
    this.stopSessionTimer();
  }
} 