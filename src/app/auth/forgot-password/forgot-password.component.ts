import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ForgotPasswordRequest } from '../../services/auth.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  loading = false;
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      
      const forgotPasswordData: ForgotPasswordRequest = {
        email: this.forgotPasswordForm.get('email')?.value.trim().toLowerCase()
      };
      
      this.authService.forgotPassword(forgotPasswordData).subscribe({
        next: (response) => {
          this.loading = false;
          this.emailSent = true;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Email Sent',
            detail: response.message || 'Password reset instructions have been sent to your email address.'
          });
          
          console.log('Password reset email sent successfully', response);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Failed to send password reset email. Please try again.';
          let errorSummary = 'Request Failed';
          
          if (error.error && error.error.detail) {
            errorMessage = error.error.detail;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Handle specific error cases
          if (error.status === 404) {
            errorMessage = 'Email address not found. Please check your email or register for a new account.';
            errorSummary = 'Email Not Found';
          } else if (error.status === 429) {
            errorMessage = 'Too many requests. Please try again later.';
            errorSummary = 'Rate Limit Exceeded';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: errorSummary,
            detail: errorMessage
          });
          
          console.error('Forgot password error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Validation',
        detail: 'Please enter a valid email address'
      });
    }
  }

  onBackToLogin() {
    this.router.navigate(['/login']);
  }
}
