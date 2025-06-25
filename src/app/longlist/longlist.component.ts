import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Navbar Component Import - Check if this path is correct
import { NavbarComponent } from '../shared/navbar/navbar.component';

interface CV {
  id: string;
  name: string;
  nationality: string;
  experience: number;
  age: number;
  qualification: string;
  selected?: boolean;
}

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-longlist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DropdownModule,
    SliderModule,
    FileUploadModule,
    CardModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    NavbarComponent // Make sure this component exists and is properly exported
  ],
  providers: [MessageService],
  templateUrl: './longlist.component.html',
  styleUrls: ['./longlist.component.scss'] // Note: changed from 'styleUrl' to 'styleUrls' (array)
})
export class LonglistComponent implements OnInit {
  // Mock CV Data
  cvs: CV[] = [
    { id: 'CV001', name: 'Patel Singh', nationality: 'Indian', experience: 4, age: 28, qualification: 'Masters Degree' },
    { id: 'CV002', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV003', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' },
    { id: 'CV004', name: 'Ahmed Khan', nationality: 'Pakistani', experience: 7, age: 32, qualification: 'Masters Degree' },
    { id: 'CV005', name: 'Sarah Johnson', nationality: 'American', experience: 3, age: 26, qualification: 'Bachelor Degree' },
    { id: 'CV006', name: 'Raj Patel', nationality: 'Indian', experience: 6, age: 29, qualification: 'PhD' },
    { id: 'CV007', name: 'Maria Garcia', nationality: 'Spanish', experience: 2, age: 25, qualification: 'Diploma' },
    { id: 'CV008', name: 'Chen Wei', nationality: 'Chinese', experience: 8, age: 35, qualification: 'Masters Degree' },
    { id: 'CV009', name: 'Patel Singh', nationality: 'Indian', experience: 4, age: 28, qualification: 'Masters Degree' },
    { id: 'CV010', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV011', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' },
    { id: 'CV012', name: 'Ahmed Khan', nationality: 'Pakistani', experience: 7, age: 32, qualification: 'Masters Degree' },
    { id: 'CV013', name: 'Sarah Johnson', nationality: 'American', experience: 3, age: 26, qualification: 'Bachelor Degree' },
    { id: 'CV014', name: 'Raj Patel', nationality: 'Indian', experience: 6, age: 29, qualification: 'PhD' },
    { id: 'CV015', name: 'Maria Garcia', nationality: 'Spanish', experience: 2, age: 25, qualification: 'Diploma' },
    { id: 'CV016', name: 'Chen Wei', nationality: 'Chinese', experience: 8, age: 35, qualification: 'Masters Degree' },
    { id: 'CV017', name: 'Patel Singh', nationality: 'Indian', experience: 4, age: 28, qualification: 'Masters Degree' },
    { id: 'CV018', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV019', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' },
    { id: 'CV020', name: 'Ahmed Khan', nationality: 'Pakistani', experience: 7, age: 32, qualification: 'Masters Degree' },
    { id: 'CV021', name: 'Sarah Johnson', nationality: 'American', experience: 3, age: 26, qualification: 'Bachelor Degree' },
    { id: 'CV022', name: 'Raj Patel', nationality: 'Indian', experience: 6, age: 29, qualification: 'PhD' },
    { id: 'CV023', name: 'Maria Garcia', nationality: 'Spanish', experience: 2, age: 25, qualification: 'Diploma' },
    { id: 'CV024', name: 'Chen Wei', nationality: 'Chinese', experience: 8, age: 35, qualification: 'Masters Degree' },
    { id: 'CV025', name: 'Patel Singh', nationality: 'Indian', experience: 4, age: 28, qualification: 'Masters Degree' },
    { id: 'CV026', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV027', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' },
    { id: 'CV028', name: 'Ahmed Khan', nationality: 'Pakistani', experience: 7, age: 32, qualification: 'Masters Degree' },
    { id: 'CV029', name: 'Sarah Johnson', nationality: 'American', experience: 3, age: 26, qualification: 'Bachelor Degree' },
    { id: 'CV030', name: 'Raj Patel', nationality: 'Indian', experience: 6, age: 29, qualification: 'PhD' },
    { id: 'CV031', name: 'Maria Garcia', nationality: 'Spanish', experience: 2, age: 25, qualification: 'Diploma' },
    { id: 'CV032', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV033', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' },
    { id: 'CV034', name: 'Ahmed Khan', nationality: 'Pakistani', experience: 7, age: 32, qualification: 'Masters Degree' },
    { id: 'CV035', name: 'Sarah Johnson', nationality: 'American', experience: 3, age: 26, qualification: 'Bachelor Degree' },
    { id: 'CV036', name: 'Raj Patel', nationality: 'Indian', experience: 6, age: 29, qualification: 'PhD' },
    { id: 'CV037', name: 'Maria Garcia', nationality: 'Spanish', experience: 2, age: 25, qualification: 'Diploma' },
    { id: 'CV038', name: 'Chen Wei', nationality: 'Chinese', experience: 8, age: 35, qualification: 'Masters Degree' },
    { id: 'CV039', name: 'Patel Singh', nationality: 'Indian', experience: 4, age: 28, qualification: 'Masters Degree' },
    { id: 'CV040', name: 'Sushil Shrestha', nationality: 'Nepali', experience: 5, age: 30, qualification: 'Masters Degree' },
    { id: 'CV041', name: 'Rohit Jaiswal', nationality: 'Indian', experience: 4, age: 28, qualification: 'Bachelor Degree' },
    { id: 'CV042', name: 'Ahmed Khan', nationality: 'Pakistani', experience: 7, age: 32, qualification: 'Masters Degree' },
    { id: 'CV043', name: 'Sarah Johnson', nationality: 'American', experience: 3, age: 26, qualification: 'Bachelor Degree' },
    { id: 'CV044', name: 'Raj Patel', nationality: 'Indian', experience: 6, age: 29, qualification: 'PhD' },
    { id: 'CV045', name: 'Maria Garcia', nationality: 'Spanish', experience: 2, age: 25, qualification: 'Diploma' },
    { id: 'CV046', name: 'Chen Wei', nationality: 'Chinese', experience: 8, age: 35, qualification: 'Masters Degree' }
  ];

  filteredCvs: CV[] = [];

  // Filter Options
  nationalityOptions: FilterOption[] = [
    { label: 'All Nationalities', value: '' },
    { label: 'Indian', value: 'Indian' },
    { label: 'Nepali', value: 'Nepali' },
    { label: 'Pakistani', value: 'Pakistani' },
    { label: 'Bangladeshi', value: 'Bangladeshi' },
    { label: 'American', value: 'American' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Chinese', value: 'Chinese' }
  ];

  // Experience options for min/max dropdowns
  experienceYearOptions: FilterOption[] = [
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10+', value: '10' }
  ];

  genderOptions: FilterOption[] = [
    { label: 'Select Gender', value: '' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  qualificationOptions: FilterOption[] = [
    { label: 'All Qualifications', value: '' },
    { label: 'Bachelor Degree', value: 'Bachelor Degree' },
    { label: 'Masters Degree', value: 'Masters Degree' },
    { label: 'PhD', value: 'PhD' },
    { label: 'Diploma', value: 'Diploma' }
  ];

  languageOptions: FilterOption[] = [
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Nepali', value: 'Nepali' },
    { label: 'Urdu', value: 'Urdu' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Chinese', value: 'Chinese' },
    { label: 'Arabic', value: 'Arabic' }
  ];

  // Filter Values
  selectedNationality: string = '';
  selectedMinExperience: string = '';
  selectedMaxExperience: string = '';
  selectedGender: string = '';
  selectedQualification: string = '';
  selectedMaxQualification: string = '';
  selectedLanguages: string[] = [];
  ageRange: number[] = [18, 65];

  // UI State
  showMaxQualification: boolean = false;
  showLanguageDropdown: boolean = false;
  tempSelectedLanguage: string = '';
  selectedFile: File | null = null;
  
  // Dropdown state
  openDropdown: string | null = null;

  constructor(private messageService: MessageService) {
    console.log('LonglistComponent constructor called');
  }

  ngOnInit() {
    console.log('LonglistComponent ngOnInit called');
    this.filteredCvs = [...this.cvs];
    
    // Set default values to empty for proper placeholders
    this.selectedMinExperience = '';
    this.selectedMaxExperience = '';
    this.selectedGender = '';
    
    console.log('Longlist component initialized with', this.cvs.length, 'CVs');
    console.log('Filtered CVs:', this.filteredCvs);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.openDropdown = null;
  }

  // Toggle dropdown open/close
  toggleDropdown(dropdownName: string) {
    event?.stopPropagation();
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }

  // Get selected label from options array
  getSelectedLabel(options: FilterOption[], value: string): string {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  // Select option from dropdown
  selectOption(dropdownName: string, value: string) {
    switch (dropdownName) {
      case 'nationality':
        this.selectedNationality = value;
        break;
      case 'minExp':
        this.selectedMinExperience = value;
        break;
      case 'maxExp':
        this.selectedMaxExperience = value;
        break;
      case 'gender':
        this.selectedGender = value;
        break;
      case 'qualification':
        this.selectedQualification = value;
        break;
      case 'maxQualification':
        this.selectedMaxQualification = value;
        break;
    }
    this.openDropdown = null;
  }

  // Clear selection
  clearSelection(dropdownName: string) {
    switch (dropdownName) {
      case 'nationality':
        this.selectedNationality = '';
        break;
      case 'minExp':
        this.selectedMinExperience = '';
        break;
      case 'maxExp':
        this.selectedMaxExperience = '';
        break;
      case 'gender':
        this.selectedGender = '';
        break;
      case 'qualification':
        this.selectedQualification = '';
        break;
      case 'maxQualification':
        this.selectedMaxQualification = '';
        break;
    }
  }

  // Language specific methods
  selectLanguage(value: string) {
    this.tempSelectedLanguage = value;
    this.openDropdown = null;
  }

  clearLanguageSelection() {
    this.tempSelectedLanguage = '';
  }

  addLanguage() {
    console.log('Add language clicked');
    if (this.tempSelectedLanguage && !this.selectedLanguages.includes(this.tempSelectedLanguage)) {
      this.selectedLanguages.push(this.tempSelectedLanguage);
      this.tempSelectedLanguage = '';
      this.openDropdown = null;
    }
  }

  onFileSelect(event: any) {
    console.log('File select event:', event);
    const files = event.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.messageService.add({
        severity: 'success',
        summary: 'File Selected',
        detail: `File "${this.selectedFile?.name}" selected successfully`
      });
    }
  }

  onFileDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('File drop event:', event);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' && file.size <= 200000000) {
        this.selectedFile = file;
        this.messageService.add({
          severity: 'success',
          summary: 'File Dropped',
          detail: `File "${file.name}" uploaded successfully`
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File',
          detail: 'Please upload a PDF file under 200MB'
        });
      }
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  resetCVs() {
    console.log('Resetting CVs...');
    this.selectedFile = null;
    this.filteredCvs = [...this.cvs];
    
    this.messageService.add({
      severity: 'info',
      summary: 'CVs Reset',
      detail: 'All CVs have been reset'
    });
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.messageService.add({
      severity: 'info',
      summary: 'File Removed',
      detail: 'Selected file has been removed'
    });
  }

  applyFilters() {
    console.log('Applying filters...');
    console.log('Selected filters:', {
      nationality: this.selectedNationality,
      minExperience: this.selectedMinExperience,
      maxExperience: this.selectedMaxExperience,
      gender: this.selectedGender,
      qualification: this.selectedQualification,
      maxQualification: this.selectedMaxQualification,
      languages: this.selectedLanguages,
      ageRange: this.ageRange
    });

    this.filteredCvs = this.cvs.filter(cv => {
      // Apply nationality filter
      if (this.selectedNationality && cv.nationality !== this.selectedNationality) {
        return false;
      }

      // Apply min experience filter
      if (this.selectedMinExperience) {
        const minExp = parseInt(this.selectedMinExperience);
        if (cv.experience < minExp) return false;
      }

      // Apply max experience filter
      if (this.selectedMaxExperience) {
        const maxExp = parseInt(this.selectedMaxExperience);
        if (cv.experience > maxExp) return false;
      }

      // Apply age filter
      if (cv.age < this.ageRange[0] || cv.age > this.ageRange[1]) {
        return false;
      }

      // Apply qualification filter
      if (this.selectedQualification && cv.qualification !== this.selectedQualification) {
        return false;
      }

      return true;
    });

    console.log('Filtered results:', this.filteredCvs);

    this.messageService.add({
      severity: 'info',
      summary: 'Filters Applied',
      detail: `${this.filteredCvs.length} CVs match your criteria`
    });
  }

  resetFilters() {
    console.log('Resetting filters...');
    this.selectedNationality = '';
    this.selectedMinExperience = '';
    this.selectedMaxExperience = '';
    this.selectedGender = '';
    this.selectedQualification = '';
    this.selectedMaxQualification = '';
    this.selectedLanguages = [];
    this.tempSelectedLanguage = '';
    this.ageRange = [18, 65];
    this.showMaxQualification = false;
    this.showLanguageDropdown = false;
    this.openDropdown = null;
    this.filteredCvs = [...this.cvs];

    this.messageService.add({
      severity: 'info',
      summary: 'Filters Reset',
      detail: 'All filters have been cleared'
    });
  }

  moveToShortListing() {
    console.log('Moving to short listing:', this.filteredCvs);
    if (this.filteredCvs.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select CVs to move to short listing'
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Moved to Short Listing',
      detail: `${this.filteredCvs.length} CV(s) moved to short listing`
    });

    // Clear selection after moving
    this.filteredCvs = [];
  }

  addMaximumQualification() {
    console.log('Add maximum qualification clicked');
    this.showMaxQualification = true;
  }

  onLanguageSelect() {
    if (this.tempSelectedLanguage && !this.selectedLanguages.includes(this.tempSelectedLanguage)) {
      this.selectedLanguages.push(this.tempSelectedLanguage);
      this.tempSelectedLanguage = '';
      this.showLanguageDropdown = false;
    }
  }

  removeLanguage(language: string) {
    this.selectedLanguages = this.selectedLanguages.filter(lang => lang !== language);
  }

  removeMaxQualification() {
    this.selectedMaxQualification = '';
    this.showMaxQualification = false;
  }
}