import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../services/auth.service';

// PrimeNG Imports - Only keeping Calendar for date picker
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface CountryCode {
  label: string;
  value: string;
  flag: string;
  display: string;
}

interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    CalendarModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  showCountryDropdown = false;
  showGenderDropdown = false;
  showCountryFieldDropdown = false;
  showNationalityDropdown = false;
  showPassword = false;
  showConfirmPassword = false;

  countryCodes: CountryCode[] = [
    { label: '+1', value: '+1', flag: 'https://flagcdn.com/w20/us.png', display: 'US +1' },
    { label: '+44', value: '+44', flag: 'https://flagcdn.com/w20/gb.png', display: 'UK +44' },
    { label: '+91', value: '+91', flag: 'https://flagcdn.com/w20/in.png', display: 'IN +91' },
    { label: '+86', value: '+86', flag: 'https://flagcdn.com/w20/cn.png', display: 'CN +86' },
    { label: '+49', value: '+49', flag: 'https://flagcdn.com/w20/de.png', display: 'DE +49' },
    { label: '+33', value: '+33', flag: 'https://flagcdn.com/w20/fr.png', display: 'FR +33' },
    { label: '+81', value: '+81', flag: 'https://flagcdn.com/w20/jp.png', display: 'JP +81' },
    { label: '+82', value: '+82', flag: 'https://flagcdn.com/w20/kr.png', display: 'KR +82' },
    { label: '+61', value: '+61', flag: 'https://flagcdn.com/w20/au.png', display: 'AU +61' },
    { label: '+55', value: '+55', flag: 'https://flagcdn.com/w20/br.png', display: 'BR +55' }
  ];

  genderOptions: DropdownOption[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer not to say' }
  ];

  countries: DropdownOption[] = [
    { label: 'United States', value: 'us' },
    { label: 'United Kingdom', value: 'uk' },
    { label: 'India', value: 'in' },
    { label: 'China', value: 'cn' },
    { label: 'Germany', value: 'de' },
    { label: 'France', value: 'fr' },
    { label: 'Japan', value: 'jp' },
    { label: 'South Korea', value: 'kr' },
    { label: 'Australia', value: 'au' },
    { label: 'Brazil', value: 'br' },
    { label: 'Canada', value: 'ca' },
    { label: 'Italy', value: 'it' },
    { label: 'Spain', value: 'es' },
    { label: 'Netherlands', value: 'nl' },
    { label: 'Sweden', value: 'se' }
  ];

  nationalities: DropdownOption[] = [
    { label: 'American', value: 'american' },
    { label: 'British', value: 'british' },
    { label: 'Indian', value: 'indian' },
    { label: 'Chinese', value: 'chinese' },
    { label: 'German', value: 'german' },
    { label: 'French', value: 'french' },
    { label: 'Japanese', value: 'japanese' },
    { label: 'Korean', value: 'korean' },
    { label: 'Australian', value: 'australian' },
    { label: 'Brazilian', value: 'brazilian' },
    { label: 'Canadian', value: 'canadian' },
    { label: 'Italian', value: 'italian' },
    { label: 'Spanish', value: 'spanish' },
    { label: 'Dutch', value: 'dutch' },
    { label: 'Swedish', value: 'swedish' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  // Custom Validators based on backend validation
  static phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    // Phone number must be in international format: +?[1-9]\d{1,14}
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(control.value)) {
      return { invalidPhone: true };
    }
    return null;
  }

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

  static genderValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const validGenders = ['male', 'female', 'other', 'prefer not to say'];
    if (!validGenders.includes(control.value.toLowerCase())) {
      return { invalidGender: true };
    }
    return null;
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(1)]],
      lastName: ['', [Validators.required, Validators.minLength(1)]],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+1', [Validators.required]],
      phone: ['', [Validators.required, RegisterComponent.phoneValidator]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required, RegisterComponent.genderValidator]],
      country: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        RegisterComponent.passwordValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
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
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        if (errors['required']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
        break;
      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;
      case 'phone':
        if (errors['required']) return 'Phone number is required';
        if (errors['invalidPhone']) return 'Phone number must be in valid international format';
        break;
      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters long';
        if (errors['missingUppercase']) return 'Password must contain at least one uppercase letter';
        if (errors['missingLowercase']) return 'Password must contain at least one lowercase letter';
        if (errors['missingDigit']) return 'Password must contain at least one digit';
        if (errors['missingSpecialChar']) return 'Password must contain at least one special character';
        break;
      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        break;
      case 'gender':
        if (errors['required']) return 'Gender is required';
        if (errors['invalidGender']) return 'Please select a valid gender';
        break;
      case 'dateOfBirth':
        if (errors['required']) return 'Date of birth is required';
        break;
      case 'country':
        if (errors['required']) return 'Country is required';
        break;
      case 'nationality':
        if (errors['required']) return 'Nationality is required';
        break;
    }
    
    return '';
  }

  getSelectedCountryFlag(): string {
    const selectedCode = this.registerForm.get('countryCode')?.value;
    const country = this.countryCodes.find(c => c.value === selectedCode);
    return country?.flag || this.countryCodes[0].flag;
  }

  getSelectedCountryCode(): CountryCode {
    const selectedCode = this.registerForm.get('countryCode')?.value;
    const country = this.countryCodes.find(c => c.value === selectedCode);
    return country || this.countryCodes[0];
  }

  toggleCountryDropdown() {
    this.showCountryDropdown = !this.showCountryDropdown;
    // Close other dropdowns
    this.showGenderDropdown = false;
    this.showCountryFieldDropdown = false;
    this.showNationalityDropdown = false;
  }

  selectCountryCode(country: CountryCode) {
    this.registerForm.patchValue({ countryCode: country.value });
    this.showCountryDropdown = false;
  }

  toggleGenderDropdown() {
    this.showGenderDropdown = !this.showGenderDropdown;
    // Close other dropdowns
    this.showCountryDropdown = false;
    this.showCountryFieldDropdown = false;
    this.showNationalityDropdown = false;
  }

  selectGender(option: DropdownOption) {
    this.registerForm.patchValue({ gender: option.value });
    this.showGenderDropdown = false;
  }

  toggleCountryFieldDropdown() {
    this.showCountryFieldDropdown = !this.showCountryFieldDropdown;
    // Close other dropdowns
    this.showCountryDropdown = false;
    this.showGenderDropdown = false;
    this.showNationalityDropdown = false;
  }

  selectCountryField(option: DropdownOption) {
    this.registerForm.patchValue({ country: option.value });
    this.showCountryFieldDropdown = false;
  }

  toggleNationalityDropdown() {
    this.showNationalityDropdown = !this.showNationalityDropdown;
    // Close other dropdowns
    this.showCountryDropdown = false;
    this.showGenderDropdown = false;
    this.showCountryFieldDropdown = false;
  }

  selectNationality(option: DropdownOption) {
    this.registerForm.patchValue({ nationality: option.value });
    this.showNationalityDropdown = false;
  }

  getSelectedGender(): string {
    const selectedValue = this.registerForm.get('gender')?.value;
    if (!selectedValue) return 'Select Gender';
    const option = this.genderOptions.find(o => o.value === selectedValue);
    return option?.label || 'Select Gender';
  }

  getSelectedCountryField(): string {
    const selectedValue = this.registerForm.get('country')?.value;
    if (!selectedValue) return 'Select Country';
    const option = this.countries.find(o => o.value === selectedValue);
    return option?.label || 'Select Country';
  }

  getSelectedNationality(): string {
    const selectedValue = this.registerForm.get('nationality')?.value;
    if (!selectedValue) return 'Select Nationality';
    const option = this.nationalities.find(o => o.value === selectedValue);
    return option?.label || 'Select Nationality';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Phone input validation - only allow numbers
  onPhoneKeyPress(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Allow backspace, delete, tab, escape, enter, and arrow keys
    if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(charCode) !== -1) {
      return;
    }
    // Allow only numbers (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onPhoneInput(event: any) {
    // Remove any non-numeric characters
    const value = event.target.value.replace(/\D/g, '');
    this.registerForm.patchValue({ phone: value });
  }

  onPhonePaste(event: ClipboardEvent) {
    // Prevent default paste behavior
    event.preventDefault();
    
    // Get pasted text and filter out non-numeric characters
    const paste = event.clipboardData?.getData('text') || '';
    const numericOnly = paste.replace(/\D/g, '');
    
    // Update the form control with numeric-only value
    this.registerForm.patchValue({ phone: numericOnly });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Close all dropdowns when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown')) {
      this.showCountryDropdown = false;
      this.showGenderDropdown = false;
      this.showCountryFieldDropdown = false;
      this.showNationalityDropdown = false;
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.loading = true;
      
      const formValue = this.registerForm.value;
      
      // Format date for API (YYYY-MM-DD)
      const dateOfBirth = formValue.dateOfBirth;
      let formattedDate = '';
      
      if (dateOfBirth instanceof Date) {
        // Format as YYYY-MM-DD
        const year = dateOfBirth.getFullYear();
        const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
        const day = String(dateOfBirth.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof dateOfBirth === 'string') {
        formattedDate = dateOfBirth;
      } else {
        console.error('Invalid date format:', dateOfBirth);
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Date',
          detail: 'Please select a valid date of birth'
        });
        this.loading = false;
        return;
      }
      
      // Validate required fields
      if (!formValue.firstName || !formValue.lastName || !formValue.email || 
          !formValue.phone || !formValue.gender || !formValue.country || 
          !formValue.nationality || !formValue.password || !formattedDate) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Incomplete Form',
          detail: 'Please fill in all required fields'
        });
        this.loading = false;
        return;
      }
      
      // Combine country code and phone number for validation
      const fullPhoneNumber = `${formValue.countryCode}${formValue.phone}`.replace(/\s+/g, '');
      
      // Validate the combined phone number
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(fullPhoneNumber)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid Phone Number',
          detail: 'Phone number must be in valid international format'
        });
        this.loading = false;
        return;
      }
      
      // Prepare registration data according to API format
      const registerData: RegisterRequest = {
        fname: formValue.firstName.trim(),
        lname: formValue.lastName.trim(),
        email: formValue.email.trim().toLowerCase(),
        phone: fullPhoneNumber,
        dateofbirth: formattedDate,
        gender: formValue.gender.toLowerCase(),
        country: formValue.country,
        nationality: formValue.nationality,
        cv_access: false, // Default value
        password: formValue.password
      };
      
      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Registration response:', response);
          
          // Show success message and navigate to login page
          this.messageService.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: 'Your account has been created successfully. Please login with your credentials.'
          });
          
          // Navigate after a short delay to allow user to see the success message
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          
          // Handle specific error cases
          let errorMessage = 'Registration failed. Please try again.';
          let errorSummary = 'Registration Failed';
          
          if (error.error && error.error.detail) {
            const detail = error.error.detail;
            if (detail.includes('phone number already exists')) {
              errorMessage = 'This phone number is already registered. Please use a different phone number or try logging in.';
              errorSummary = 'Phone Already Registered';
            } else if (detail.includes('email already exists')) {
              errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
              errorSummary = 'Email Already Registered';
            } else {
              errorMessage = detail;
            }
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
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
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      
      // Show validation error message
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Validation',
        detail: 'Please correct the errors in the form before submitting'
      });
    }
  }

  onLogin() {
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
