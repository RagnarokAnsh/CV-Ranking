import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
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
    PasswordModule,
    CardModule,
    FloatLabelModule,
    DropdownModule,
    CalendarModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;

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
    private router: Router
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

  onRegister() {
    if (this.registerForm.valid) {
      this.loading = true;
      // Simulate registration process
      setTimeout(() => {
        this.loading = false;
        // Navigate to login or handle registration logic
        console.log('Registration successful', this.registerForm.value);
        this.router.navigate(['/login']);
      }, 1500);
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
