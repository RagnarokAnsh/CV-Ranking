import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { AuthService, ChangePasswordRequest } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
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
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm!: FormGroup;
  loading = false;
  passwordChanged = false;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordValidator()]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Password strength validator
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      const hasNumber = /[0-9]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasSpecial = /[#?!@$%^&*-]/.test(value);
      const hasMinLength = value.length >= 8;

      const passwordValid = hasNumber && hasUpper && hasLower && hasSpecial && hasMinLength;

      return !passwordValid ? { 
        passwordStrength: {
          hasNumber,
          hasUpper,
          hasLower,
          hasSpecial,
          hasMinLength
        }
      } : null;
    };
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      this.loading = true;
      
      const changePasswordData: ChangePasswordRequest = {
        old_password: this.changePasswordForm.get('oldPassword')?.value,
        new_password: this.changePasswordForm.get('newPassword')?.value,
        confirm_new_password: this.changePasswordForm.get('confirmPassword')?.value
      };
      
      this.authService.changePassword(changePasswordData).subscribe({
        next: (response) => {
          this.loading = false;
          this.passwordChanged = true;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Password Changed',
            detail: response.message || 'Your password has been changed successfully!'
          });
          
          console.log('Password change successful', response);
        },
        error: (error) => {
          this.loading = false;
          console.error('Password change error:', error);
          
          let errorMessage = 'Failed to change password. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.detail) {
            errorMessage = error.error.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Password Change Failed',
            detail: errorMessage
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
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

  // Helper method to check if passwords match
  get passwordsMatch(): boolean {
    const newPassword = this.changePasswordForm.get('newPassword')?.value;
    const confirmPassword = this.changePasswordForm.get('confirmPassword')?.value;
    return newPassword === confirmPassword;
  }

  // Helper method to check if confirm password field has been touched and passwords don't match
  get showPasswordMismatchError(): boolean {
    const confirmPassword = this.changePasswordForm.get('confirmPassword');
    return !!(confirmPassword?.touched && !this.passwordsMatch && confirmPassword?.value);
  }

  toggleOldPasswordVisibility() {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Helper methods for password validation error display
  getPasswordError(field: string): string {
    const control = this.changePasswordForm.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return field === 'oldPassword' ? 'Current password is required' : 
             field === 'newPassword' ? 'New password is required' : 
             'Please confirm your new password';
    }

    if (control.errors['minlength']) {
      return 'Password must be at least 8 characters long';
    }

    if (control.errors['passwordStrength']) {
      const errors = control.errors['passwordStrength'];
      if (!errors.hasMinLength) return 'Password must be at least 8 characters long';
      if (!errors.hasUpper) return 'Password must contain at least one uppercase letter';
      if (!errors.hasLower) return 'Password must contain at least one lowercase letter';
      if (!errors.hasNumber) return 'Password must contain at least one number';
      if (!errors.hasSpecial) return 'Password must contain at least one special character (#?!@$%^&*-)';
    }

    return '';
  }

  hasPasswordError(field: string): boolean {
    const control = this.changePasswordForm.get(field);
    return !!(control && control.errors && control.touched);
  }
}
