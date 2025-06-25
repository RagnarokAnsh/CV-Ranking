import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

// Services
import { SessionTimerService } from '../services/session-timer.service';
import { AuthService } from '../services/auth.service';
import { ResumeService, ResumeData, UploadResumeResponse } from '../services/resume.service';

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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

// Navbar Component Import
import { NavbarComponent } from '../shared/navbar/navbar.component';

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
    ProgressSpinnerModule,
    NavbarComponent
  ],
  providers: [MessageService],
  templateUrl: './longlist.component.html',
  styleUrls: ['./longlist.component.scss']
})
export class LonglistComponent implements OnInit {
  // API Data
  resumeData: ResumeData[] = [];
  filteredResumeData: ResumeData[] = [];
  pdfId: number | null = null;
  
  // Loading States
  isUploading: boolean = false;
  uploadProgress: number = 0;

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
  ageRange: number[] = [18, 65]; // For UI display only - Coming Soon feature
  
  // UI State
  showMaxQualification: boolean = false;
  showLanguageDropdown: boolean = false;
  tempSelectedLanguage: string = '';
  selectedFile: File | null = null;
  openDropdown: string | null = null;

  constructor(
    private messageService: MessageService,
    private sessionTimerService: SessionTimerService,
    private authService: AuthService,
    private resumeService: ResumeService
  ) {
    console.log('LonglistComponent constructor called');
  }

  ngOnInit() {
    console.log('LonglistComponent ngOnInit called');
    this.filteredResumeData = [...this.resumeData];
    
    // Set default values to empty for proper placeholders
    this.selectedMinExperience = '';
    this.selectedMaxExperience = '';
    this.selectedGender = '';
    
    console.log('Longlist component initialized');
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

  onFileSelect(event: any): void {
    console.log('File select event:', event);
    
    // Handle only single file since API supports one file at a time
    const file = event.files && event.files.length > 0 ? event.files[0] : null;
    
    if (!file) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No File Selected',
        detail: 'Please select a P11 PDF file to upload.'
      });
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File Type',
        detail: 'Please select a PDF file only.'
      });
      return;
    }

    // Validate file size (200MB max)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (file.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Please select a file smaller than 200MB.'
      });
      return;
    }

    // Clear any existing data and upload the file
    this.resumeData = [];
    this.filteredResumeData = [];
    this.uploadResume(file);
  }

  onFileDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('File drop event:', event);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Use the same validation and upload logic as onFileSelect
      // Validate file type
      if (file.type !== 'application/pdf') {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File Type',
          detail: 'Please select a PDF file only.'
        });
        return;
      }

      // Validate file size (200MB max)
      const maxSize = 200 * 1024 * 1024; // 200MB in bytes
      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'Please select a file smaller than 200MB.'
        });
        return;
      }

      // Clear any existing data and upload the file
      this.resumeData = [];
      this.filteredResumeData = [];
      this.uploadResume(file);
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
    this.resumeData = [];
    this.filteredResumeData = [];
    this.pdfId = null;
    this.isUploading = false;
    
    // Reset filters
    this.resetFilters();
    
    this.messageService.add({
      severity: 'info',
      summary: 'CVs Reset',
      detail: 'All CVs have been reset. Upload a new P11 file to start.'
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
      languages: this.selectedLanguages
    });

    this.filteredResumeData = this.resumeData.filter(cv => {
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

      // Apply qualification filter
      if (this.selectedQualification && cv.qualification !== this.selectedQualification) {
        return false;
      }

      return true;
    });

    console.log('Filtered results:', this.filteredResumeData);

    this.messageService.add({
      severity: 'info',
      summary: 'Filters Applied',
      detail: `${this.filteredResumeData.length} CVs match your criteria`
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
    this.ageRange = [18, 65]; // Reset for UI display
    this.showMaxQualification = false;
    this.showLanguageDropdown = false;
    this.openDropdown = null;
    this.filteredResumeData = [...this.resumeData];

    this.messageService.add({
      severity: 'info',
      summary: 'Filters Reset',
      detail: 'All filters have been cleared'
    });
  }

  moveToShortListing() {
    console.log('Moving to short listing:', this.filteredResumeData);
    if (this.filteredResumeData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Selection',
        detail: 'Please select CVs to move to short listing'
      });
      return;
    }

    if (!this.pdfId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No PDF ID found. Please upload a file first.'
      });
      return;
    }

    // Call API to save filtered resumes
    this.saveFilteredResumes();
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

  // Upload resume to API
  uploadResume(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;

    this.resumeService.uploadResume(file)
      .pipe(
        finalize(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
        })
      )
      .subscribe({
        next: (response) => this.handleUploadSuccess(response),
        error: (error) => this.handleUploadError(error)
      });
  }

  private handleUploadSuccess(response: UploadResumeResponse) {
    this.isUploading = false;
    console.log('Upload response:', response);
    
    // Check if we have data and pdf_id (actual response structure)
    if (response.data && response.pdf_id) {
      this.pdfId = response.pdf_id;
      
      // Transform the API data to match our expected format
      this.resumeData = response.data.map((item: any) => {
        // Clean up nationality - remove array brackets and quotes if present
        let nationality = item['Nationality'] || '';
        if (nationality.startsWith('[') && nationality.endsWith(']')) {
          nationality = nationality.slice(1, -1).replace(/'/g, '').trim();
        }
        
        return {
          id: item['CV ID'],
          name: item['Name'] || 'Unknown',
          nationality: nationality,
          experience: parseInt(item['YOE']) || 0,
          qualification: item['Highest Degree'] || '',
          gender: item['Gender'] || '',
          employmentHistory: item['Employment History'] || ''
        };
      });
      
      this.filteredResumeData = [...this.resumeData];
      
      // Debug: Log the first few transformed records
      console.log('First 3 transformed records:', this.resumeData.slice(0, 3));
      
      // Update filter options based on actual data
      this.updateFilterOptions();
      
      this.messageService.add({
        severity: 'success',
        summary: 'File Processed Successfully',
        detail: `Found ${this.resumeData.length} resumes in the P11 file`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Processing Failed',
        detail: response.message || 'Failed to process the P11 file'
      });
    }
  }

  private handleUploadError(error: any): void {
    console.log('Upload error:', error);
    console.log('Error status:', error.status);
    console.log('Error message:', error.message);
    console.log('Error details:', error.error);
    
    // Log detailed server response for 422 errors
    if (error.status === 422 && error.error) {
      console.log('422 Validation Error Details:');
      if (error.error.detail && Array.isArray(error.error.detail)) {
        error.error.detail.forEach((detail: any, index: number) => {
          console.log(`Detail ${index + 1}:`, detail);
        });
      }
      if (error.error.message) {
        console.log('Server message:', error.error.message);
      }
      // Log the entire error object structure
      console.log('Full error object:', JSON.stringify(error.error, null, 2));
    }
    
    this.isUploading = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: error.status === 422 
        ? 'The server could not process the file. Please check the file format and try again.'
        : 'Failed to upload file. Please try again.'
    });
  }

  // Save filtered resumes to backend
  saveFilteredResumes() {
    if (!this.pdfId || this.filteredResumeData.length === 0) {
      return;
    }

    this.resumeService.saveFilteredResumes({
      pdf_id: this.pdfId,
      data: this.filteredResumeData
    }).subscribe({
      next: (response) => {
        console.log('Save filtered response:', response);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Moved to Short Listing',
          detail: `${this.filteredResumeData.length} CV(s) moved to short listing successfully`
        });
        
        // Optionally clear the filtered data after moving
        // this.filteredResumeData = [];
      },
      error: (error) => {
        console.error('Save filtered error:', error);
        
        let errorMessage = 'Failed to move CVs to short listing. Please try again.';
        if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: errorMessage
        });
      }
    });
  }

  // Update filter options based on actual data from API
  updateFilterOptions() {
    if (this.resumeData.length === 0) return;

    // Update nationality options based on actual data
    const nationalities = [...new Set(this.resumeData.map(cv => cv.nationality))].filter(Boolean) as string[];
    this.nationalityOptions = [
      { label: 'All Nationalities', value: '' },
      ...nationalities.map(nationality => ({ label: nationality, value: nationality }))
    ];

    // Update qualification options based on actual data
    const qualifications = [...new Set(this.resumeData.map(cv => cv.qualification))].filter(Boolean) as string[];
    this.qualificationOptions = [
      { label: 'All Qualifications', value: '' },
      ...qualifications.map(qualification => ({ label: qualification, value: qualification }))
    ];

    // Update gender options if gender data is available
    if (this.resumeData.some(cv => cv.gender)) {
      const genders = [...new Set(this.resumeData.map(cv => cv.gender))].filter(Boolean) as string[];
      this.genderOptions = [
        { label: 'Select Gender', value: '' },
        ...genders.map(gender => ({ label: gender, value: gender }))
      ];
    }
  }
}