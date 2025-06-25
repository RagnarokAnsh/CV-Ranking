import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SessionTimerService } from './services/session-timer.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'CV-Ranking';

  constructor(
    private authService: AuthService,
    private sessionTimerService: SessionTimerService
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in and start session timer
    if (this.authService.isAuthenticated()) {
      console.log('User already logged in, starting session timer');
      this.sessionTimerService.startSessionTimer();
    }

    // Subscribe to user changes to start/stop session timer
    this.authService.currentUser$.subscribe(user => {
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
    this.sessionTimerService.stopSessionTimer();
  }
}
