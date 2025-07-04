import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SessionTimerService } from './services/session-timer.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'CV-Ranking';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private sessionTimerService: SessionTimerService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in and start session timer
    if (this.authService.isAuthenticated()) {
      console.log('User already logged in, starting session timer');
      this.sessionTimerService.startSessionTimer();
    }

    // Subscribe to user changes to start/stop session timer
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        if (user && this.authService.isAuthenticated()) {
          console.log('User logged in, starting session timer');
          this.sessionTimerService.startSessionTimer();
        } else {
          console.log('User logged out, stopping session timer');
          this.sessionTimerService.stopSessionTimer();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.sessionTimerService.stopSessionTimer();
  }
}
