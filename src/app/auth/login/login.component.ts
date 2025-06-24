import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest, LoginVerifyRequest } from '../../services/auth.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  otpForm!: FormGroup;
  loading = false;
  showPassword = false;
  showOtpStep = false;
  otpSent = false;
  userEmail = '';
  resendLoading = false;
  countdown = 0;
  countdownInterval: any;
  userId: number = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForms();
  }

  initializeForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.userEmail = this.loginForm.get('email')?.value;
      
      const loginData: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };
      
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Login response:', response);
          
          // Extract user_id from response (could be in different formats)
          this.userId = response.user_id || response.id || response.userId || 0;
          this.showOtpStep = true;
          this.otpSent = true;
          this.startCountdown();
          console.log('OTP sent to:', this.userEmail, 'User ID:', this.userId);
        },
        error: (error) => {
          this.loading = false;
          console.error('Login error:', error);
          alert('Login failed. Please check your credentials.');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onVerifyOtp() {
    if (this.otpForm.valid) {
      this.loading = true;
      
      const verifyData: LoginVerifyRequest = {
        user_id: this.userId,
        otp: this.otpForm.get('otp')?.value
      };
      
      this.authService.verifyLogin(verifyData).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('OTP verification response:', response);
          
          try {
            // If we get a successful response (200 status), consider it successful
            console.log('Login successful with OTP:', response);
            // Navigate to dashboard or main page
            this.router.navigate(['/longlist']); // or wherever you want to redirect after login
          } catch (error) {
            console.error('Error during navigation:', error);
            alert('Login successful, but navigation failed. Please refresh the page.');
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('OTP verification error:', error);
          
          // Handle specific error cases
          let errorMessage = 'OTP verification failed. Please try again.';
          if (error.error && error.error.detail) {
            errorMessage = error.error.detail;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          alert(errorMessage);
        }
      });
    } else {
      // Mark OTP field as touched to show validation errors
      this.otpForm.get('otp')?.markAsTouched();
    }
  }

  onResendOtp() {
    if (this.countdown > 0) return;
    
    this.resendLoading = true;
    
    // Call login API again to resend OTP
    const loginData: LoginRequest = {
      email: this.userEmail,
      password: this.loginForm.get('password')?.value
    };
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.resendLoading = false;
        console.log('Resend OTP response:', response);
        
        // Extract user_id from response
        this.userId = response.user_id || response.id || response.userId || 0;
        this.startCountdown();
        console.log('OTP resent to:', this.userEmail);
      },
      error: (error) => {
        this.resendLoading = false;
        console.error('Resend OTP error:', error);
        alert('Failed to resend OTP. Please try again.');
      }
    });
  }

  startCountdown() {
    this.countdown = 60; // 60 seconds countdown
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  onBackToLogin() {
    this.showOtpStep = false;
    this.otpSent = false;
    this.otpForm.reset();
    this.userEmail = '';
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdown = 0;
  }

  onForgotPassword() {
    // Navigate to forgot password page
    this.router.navigate(['/forgot-password']);
  }

  onRegister() {
    // Navigate to register page
    this.router.navigate(['/register']);
  }

  onOtpInput(event: any) {
    // Allow only numeric input for OTP
    const value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
    this.otpForm.patchValue({ otp: value });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
