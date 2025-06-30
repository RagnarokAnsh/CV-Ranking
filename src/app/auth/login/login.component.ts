import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, LoginRequest, LoginVerifyRequest, LoginResendOtpRequest } from '../../services/auth.service';
import { SessionTimerService } from '../../services/session-timer.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
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
    private authService: AuthService,
    private sessionTimerService: SessionTimerService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initializeForms();
  }

  initializeForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.userEmail = this.loginForm.get('email')?.value.trim().toLowerCase();
      
      const loginData: LoginRequest = {
        email: this.userEmail,
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
          
          this.messageService.add({
            severity: 'info',
            summary: 'OTP Sent',
            detail: `A verification code has been sent to ${this.userEmail}`
          });
          
          console.log('OTP sent to:', this.userEmail, 'User ID:', this.userId);
        },
        error: (error) => {
          this.loading = false;
          console.error('Login error:', error);
          
          // Handle specific error cases
          let errorMessage = 'Login failed. Please check your credentials.';
          let errorSummary = 'Login Failed';
          
          if (error.error && error.error.detail) {
            const detail = error.error.detail;
            if (detail.includes('Invalid credentials') || detail.includes('incorrect')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
              errorSummary = 'Invalid Credentials';
            } else if (detail.includes('not found') || detail.includes('does not exist')) {
              errorMessage = 'Account not found. Please check your email or register for a new account.';
              errorSummary = 'Account Not Found';
            } else if (detail.includes('inactive') || detail.includes('disabled')) {
              errorMessage = 'Your account is inactive. Please contact support.';
              errorSummary = 'Account Inactive';
            } else {
              errorMessage = detail;
            }
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
            errorSummary = 'Authentication Failed';
          } else if (error.status === 404) {
            errorMessage = 'Account not found. Please check your email or register.';
            errorSummary = 'Account Not Found';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: errorSummary,
            detail: errorMessage
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Validation',
        detail: 'Please correct the errors in the form before submitting'
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
            // Show success message
            this.messageService.add({
              severity: 'success',
              summary: 'Login Successful',
              detail: 'Welcome back! Redirecting to dashboard...'
            });
            
            console.log('Login successful with OTP:', response);
            
            // Navigate after a short delay to allow user to see the success message
            setTimeout(() => {
              this.router.navigate(['/longlist']);
            }, 1500);

            // Start session timer
            this.sessionTimerService.startSessionTimer();
          } catch (error) {
            console.error('Error during navigation:', error);
            this.messageService.add({
              severity: 'warn',
              summary: 'Login Successful',
              detail: 'Login successful, but navigation failed. Please refresh the page.'
            });
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('OTP verification error:', error);
          
          // Handle specific error cases
          let errorMessage = 'OTP verification failed. Please try again.';
          let errorSummary = 'Verification Failed';
          
          if (error.error && error.error.detail) {
            const detail = error.error.detail;
            if (detail.includes('invalid') || detail.includes('incorrect')) {
              errorMessage = 'Invalid OTP. Please check the code and try again.';
              errorSummary = 'Invalid OTP';
            } else if (detail.includes('expired')) {
              errorMessage = 'OTP has expired. Please request a new code.';
              errorSummary = 'OTP Expired';
            } else {
              errorMessage = detail;
            }
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid OTP. Please check the code and try again.';
            errorSummary = 'Invalid OTP';
          } else if (error.status === 401) {
            errorMessage = 'OTP verification failed. Please try again.';
            errorSummary = 'Verification Failed';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: errorSummary,
            detail: errorMessage
          });
        }
      });
    } else {
      // Mark OTP field as touched to show validation errors
      this.otpForm.get('otp')?.markAsTouched();
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid OTP',
        detail: 'Please enter a valid 6-digit OTP'
      });
    }
  }

  onResendOtp() {
    if (this.countdown > 0) return;
    
    this.resendLoading = true;
    
    // Use the dedicated resend OTP API
    const resendData: LoginResendOtpRequest = {
      user_id: this.userId
    };
    
    this.authService.resendLoginOtp(resendData).subscribe({
      next: (response) => {
        this.resendLoading = false;
        console.log('Resend OTP response:', response);
        
        this.startCountdown();
        
        this.messageService.add({
          severity: 'success',
          summary: 'OTP Resent',
          detail: `A new verification code has been sent to ${this.userEmail}`
        });
        
        console.log('OTP resent to:', this.userEmail, 'for user ID:', this.userId);
      },
      error: (error) => {
        this.resendLoading = false;
        console.error('Resend OTP error:', error);
        
        // Handle specific error cases
        let errorMessage = 'Failed to resend OTP. Please try again.';
        let errorSummary = 'Resend Failed';
        
        if (error.error && error.error.detail) {
          const detail = error.error.detail;
          if (detail.includes('user not found') || detail.includes('invalid user')) {
            errorMessage = 'User session expired. Please login again.';
            errorSummary = 'Session Expired';
            // Reset to login step
            this.onBackToLogin();
          } else if (detail.includes('rate limit') || detail.includes('too many')) {
            errorMessage = 'Too many requests. Please wait before requesting another OTP.';
            errorSummary = 'Rate Limited';
          } else {
            errorMessage = detail;
          }
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid request. Please try logging in again.';
          errorSummary = 'Invalid Request';
        } else if (error.status === 404) {
          errorMessage = 'User session not found. Please login again.';
          errorSummary = 'Session Not Found';
          // Reset to login step
          this.onBackToLogin();
        } else if (error.status === 429) {
          errorMessage = 'Too many requests. Please wait before requesting another OTP.';
          errorSummary = 'Rate Limited';
        }
        
        this.messageService.add({
          severity: 'error',
          summary: errorSummary,
          detail: errorMessage
        });
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
