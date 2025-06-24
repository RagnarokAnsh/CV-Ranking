import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../services/auth.service';

// PrimeNG Imports - Only keeping Calendar for date picker
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';

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
    CalendarModule
  ],
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
    { label: 'Other', value: 'other' }
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
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+1', [Validators.required]],
      phone: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      country: ['', [Validators.required]],
      nationality: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
        alert('Please select a valid date of birth');
        this.loading = false;
        return;
      }
      
      // Validate required fields
      if (!formValue.firstName || !formValue.lastName || !formValue.email || 
          !formValue.phone || !formValue.gender || !formValue.country || 
          !formValue.nationality || !formValue.password || !formattedDate) {
        alert('Please fill in all required fields');
        this.loading = false;
        return;
      }
      
      // Prepare registration data according to API format
      const registerData: RegisterRequest = {
        fname: formValue.firstName.trim(),
        lname: formValue.lastName.trim(),
        email: formValue.email.trim().toLowerCase(),
        phone: `${formValue.countryCode}${formValue.phone}`.replace(/\s+/g, ''),
        dateofbirth: formattedDate,
        gender: formValue.gender,
        country: formValue.country,
        nationality: formValue.nationality,
        cv_access: false, // Default value
        password: formValue.password
      };
      
      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Registration response:', response);
          
          // Check if registration was successful (200 status means success)
          // Show success message and navigate to login page
          alert('Registration successful! Please login with your credentials.');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.loading = false;
          
          // Handle specific error cases
          let errorMessage = 'Registration failed. Please try again.';
          
          if (error.error && error.error.detail) {
            const detail = error.error.detail;
            if (detail.includes('phone number already exists')) {
              errorMessage = 'This phone number is already registered. Please use a different phone number or try logging in.';
            } else if (detail.includes('email already exists')) {
              errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
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
          
          alert('Registration failed: ' + errorMessage);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  onLogin() {
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
