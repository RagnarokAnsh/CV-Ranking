import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, ResetPasswordRequest } from '../../services/auth.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  passwordReset = false;
  token: string | null = null;
  tokenValid = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Get token from URL parameters
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Link',
        detail: 'This password reset link is invalid. Please request a new one.'
      });
      
      setTimeout(() => {
        this.router.navigate(['/forgot-password']);
      }, 3000);
      return;
    }
    
    this.tokenValid = true;
    this.initializeForm();
  }

  // Custom Validators matching backend requirements
  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const errors: ValidationErrors = {};
    
    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(control.value)) {
      errors['missingUppercase'] = true;
    }
    
    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(control.value)) {
      errors['missingLowercase'] = true;
    }
    
    // Must contain at least one digit
    if (!/[0-9]/.test(control.value)) {
      errors['missingDigit'] = true;
    }
    
    // Must contain at least one special character
    if (!/[^A-Za-z0-9]/.test(control.value)) {
      errors['missingSpecialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  initializeForm() {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8),
        ResetPasswordComponent.passwordValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  // Helper method to get validation error messages
  getFieldErrorMessage(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    switch (fieldName) {
      case 'newPassword':
        if (errors['required']) return 'New password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters long';
        if (errors['missingUppercase']) return 'Password must contain at least one uppercase letter';
        if (errors['missingLowercase']) return 'Password must contain at least one lowercase letter';
        if (errors['missingDigit']) return 'Password must contain at least one digit';
        if (errors['missingSpecialChar']) return 'Password must contain at least one special character';
        break;
      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your new password';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        break;
    }
    
    return '';
  }

  onSubmit() {
    if (this.resetPasswordForm.valid && this.token) {
      this.loading = true;
      
      const resetData: ResetPasswordRequest = {
        token: this.token,
        new_password: this.resetPasswordForm.get('newPassword')?.value,
        confirm_password: this.resetPasswordForm.get('confirmPassword')?.value
      };
      
      this.authService.resetPassword(resetData).subscribe({
        next: (response) => {
          this.loading = false;
          this.passwordReset = true;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Password Reset Successful',
            detail: response.message || 'Your password has been reset successfully. You can now login with your new password.'
          });
          
          console.log('Password reset successful', response);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Password reset failed. Please try again.';
          let errorSummary = 'Reset Failed';
          
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
          if (error.status === 400) {
            if (errorMessage.includes('token') || errorMessage.includes('invalid') || errorMessage.includes('expired')) {
              errorMessage = 'This reset link has expired or is invalid. Please request a new password reset.';
              errorSummary = 'Invalid Reset Link';
            } else if (errorMessage.includes('password')) {
              errorMessage = 'Password does not meet the requirements. Please check the password criteria.';
              errorSummary = 'Invalid Password';
            }
          } else if (error.status === 404) {
            errorMessage = 'Reset token not found. Please request a new password reset.';
            errorSummary = 'Token Not Found';
          } else if (error.status === 422) {
            errorMessage = 'Invalid data provided. Please check your input and try again.';
            errorSummary = 'Validation Error';
          }
          
          this.messageService.add({
            severity: 'error',
            summary: errorSummary,
            detail: errorMessage
          });
          
          console.error('Password reset error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Validation',
        detail: 'Please correct the errors in the form before submitting'
      });
    }
  }

  onBackToLogin() {
    this.router.navigate(['/login']);
  }

  onRequestNewLink() {
    this.router.navigate(['/forgot-password']);
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
