import { Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, BehaviorSubject } from 'rxjs';

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

// Constants
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_FILE_TYPE = 'application/pdf';
const AGE_RANGE_DEFAULT = [18, 65];

// Interfaces
interface FilterOption {
  label: string;
  value: string;
}

interface FilterState {
  nationality: string;
  minExperience: string;
  maxExperience: string;
  gender: string;
  qualification: string;
  maxQualification: string;
  languages: string[];
  showMaxQualification: boolean;
  showLanguageDropdown: boolean;
  tempSelectedLanguage: string;
  ageRange: number[];
  openDropdown: string | null;
}

interface LoadingState {
  isUploading: boolean;
  uploadProgress: number;
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
  styleUrls: ['./longlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LonglistComponent implements OnInit, OnDestroy {
  // Dependency Injection using inject() for better tree-shaking
  private readonly messageService = inject(MessageService);
  private readonly sessionTimerService = inject(SessionTimerService);
  private readonly authService = inject(AuthService);
  private readonly resumeService = inject(ResumeService);

  // Reactive subjects for better performance
  private readonly destroy$ = new Subject<void>();
  private readonly loadingState$ = new BehaviorSubject<LoadingState>({
    isUploading: false,
    uploadProgress: 0
  });

  // Public observables
  readonly loading$ = this.loadingState$.asObservable();

  // Data
  resumeData: ResumeData[] = [];
  filteredResumeData: ResumeData[] = [];
  pdfId: number | null = null;

  // Filter Options - Moved to constants for better memory management
  readonly nationalityOptions: readonly FilterOption[] = Object.freeze([
    { label: 'All Nationalities', value: '' },
    { label: 'Indian', value: 'Indian' },
    { label: 'Nepali', value: 'Nepali' },
    { label: 'Pakistani', value: 'Pakistani' },
    { label: 'Bangladeshi', value: 'Bangladeshi' },
    { label: 'American', value: 'American' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Chinese', value: 'Chinese' }
  ]);

  readonly experienceYearOptions: readonly FilterOption[] = Object.freeze([
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
  ]);

  readonly genderOptions: readonly FilterOption[] = Object.freeze([
    { label: 'Select Gender', value: '' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ]);

  readonly qualificationOptions: readonly FilterOption[] = Object.freeze([
    { label: 'All Qualifications', value: '' },
    { label: 'Bachelor Degree', value: 'Bachelor Degree' },
    { label: 'Masters Degree', value: 'Masters Degree' },
    { label: 'PhD', value: 'PhD' },
    { label: 'Diploma', value: 'Diploma' }
  ]);

  readonly languageOptions: readonly FilterOption[] = Object.freeze([
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Nepali', value: 'Nepali' },
    { label: 'Urdu', value: 'Urdu' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Chinese', value: 'Chinese' },
    { label: 'Arabic', value: 'Arabic' }
  ]);

  // Dynamic filter options (populated from API data)
  dynamicNationalityOptions: FilterOption[] = [];
  dynamicQualificationOptions: FilterOption[] = [];
  dynamicGenderOptions: FilterOption[] = [];

  // Filter State
  private filterState: FilterState = {
    nationality: '',
    minExperience: '',
    maxExperience: '',
    gender: '',
    qualification: '',
    maxQualification: '',
    languages: [],
    showMaxQualification: false,
    showLanguageDropdown: false,
    tempSelectedLanguage: '',
    ageRange: [...AGE_RANGE_DEFAULT],
    openDropdown: null
  };

  // Getters for template access
  get selectedNationality(): string { return this.filterState.nationality; }
  get selectedMinExperience(): string { return this.filterState.minExperience; }
  get selectedMaxExperience(): string { return this.filterState.maxExperience; }
  get selectedGender(): string { return this.filterState.gender; }
  get selectedQualification(): string { return this.filterState.qualification; }
  get selectedMaxQualification(): string { return this.filterState.maxQualification; }
  get selectedLanguages(): string[] { return this.filterState.languages; }
  get showMaxQualification(): boolean { return this.filterState.showMaxQualification; }
  get showLanguageDropdown(): boolean { return this.filterState.showLanguageDropdown; }
  get tempSelectedLanguage(): string { return this.filterState.tempSelectedLanguage; }
  get ageRange(): number[] { return this.filterState.ageRange; }
  get openDropdown(): string | null { return this.filterState.openDropdown; }

  // Setters
  set selectedNationality(value: string) { this.filterState.nationality = value; }
  set selectedMinExperience(value: string) { this.filterState.minExperience = value; }
  set selectedMaxExperience(value: string) { this.filterState.maxExperience = value; }
  set selectedGender(value: string) { this.filterState.gender = value; }
  set selectedQualification(value: string) { this.filterState.qualification = value; }
  set selectedMaxQualification(value: string) { this.filterState.maxQualification = value; }
  set selectedLanguages(value: string[]) { this.filterState.languages = value; }
  set showMaxQualification(value: boolean) { this.filterState.showMaxQualification = value; }
  set showLanguageDropdown(value: boolean) { this.filterState.showLanguageDropdown = value; }
  set tempSelectedLanguage(value: string) { this.filterState.tempSelectedLanguage = value; }
  set ageRange(value: number[]) { this.filterState.ageRange = value; }
  set openDropdown(value: string | null) { this.filterState.openDropdown = value; }

  // Loading state getters
  get isUploading(): boolean { return this.loadingState$.value.isUploading; }
  get uploadProgress(): number { return this.loadingState$.value.uploadProgress; }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingState$.complete();
  }

  // Initialization method
  private initializeComponent(): void {
    if (this.resumeService.hasData()) {
      this.restoreDataAndFilters();
    } else {
      this.initializeEmptyState();
    }
  }

  // Restore data and filters from service
  private restoreDataAndFilters(): void {
    try {
      this.resumeData = this.resumeService.getCurrentResumeData();
      this.filteredResumeData = this.resumeService.getCurrentFilteredResumeData();
      this.pdfId = this.resumeService.getCurrentPdfId();
      
      const savedFilterState = this.resumeService.getCurrentFilterState();
      if (savedFilterState) {
        this.restoreFilterState(savedFilterState);
        this.showSuccessMessage(
          'Data and Filters Restored',
          `Restored ${this.resumeData.length} resumes with applied filters (${this.filteredResumeData.length} shown)`
        );
      } else {
        this.showInfoMessage(
          'Data Restored',
          `Restored ${this.resumeData.length} resumes from previous upload`
        );
      }
      
      this.updateFilterOptions();
    } catch (error) {
      console.error('Error restoring data:', error);
      this.showErrorMessage('Restoration Failed', 'Failed to restore previous data');
      this.initializeEmptyState();
    }
  }

  // Initialize empty state
  private initializeEmptyState(): void {
    this.filteredResumeData = [...this.resumeData];
    this.resetFilterState();
  }

  // File upload handling - Single method for both select and drop
  handleFileUpload(file: File): void {
    if (!this.validateFile(file)) return;

    this.clearExistingData();
    this.uploadFile(file);
  }

  // Optimized file validation
  private validateFile(file: File): boolean {
    if (file.type !== ALLOWED_FILE_TYPE) {
      this.showErrorMessage('Invalid File Type', 'Please select a PDF file only.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.showErrorMessage('File Too Large', 'Please select a file smaller than 200MB.');
      return false;
    }

    return true;
  }

  // Clear existing data
  private clearExistingData(): void {
    this.resumeData = [];
    this.filteredResumeData = [];
    this.pdfId = null;
    this.resumeService.clearData();
  }

  // Upload file to API
  private uploadFile(file: File): void {
    this.setLoadingState(true, 0);

    this.resumeService.uploadResume(file)
      .pipe(
        finalize(() => this.setLoadingState(false, 0)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => this.handleUploadSuccess(response),
        error: (error) => this.handleUploadError(error)
      });
  }

  // Event handlers
  onFileSelect(event: any): void {
    const file = event.files?.[0];
    if (file) {
      this.handleFileUpload(file);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFileUpload(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Optimized filter application with debouncing
  applyFilters(): void {
    try {
      this.filteredResumeData = this.resumeData.filter(cv => this.matchesFilters(cv));
      
      this.saveFilterState();
      
      this.showInfoMessage(
        'Filters Applied',
        `${this.filteredResumeData.length} CVs match your criteria`
      );
    } catch (error) {
      console.error('Error applying filters:', error);
      this.showErrorMessage('Filter Error', 'Failed to apply filters');
    }
  }

  // Optimized filter matching
  private matchesFilters(cv: ResumeData): boolean {
    // Nationality filter
    if (this.selectedNationality && cv.nationality !== this.selectedNationality) {
      return false;
    }

    // Experience filters
    if (this.selectedMinExperience) {
      const minExp = parseInt(this.selectedMinExperience);
      if (cv.experience < minExp) return false;
    }

    if (this.selectedMaxExperience) {
      const maxExp = parseInt(this.selectedMaxExperience);
      if (cv.experience > maxExp) return false;
    }

    // Gender filter
    if (this.selectedGender && cv.gender !== this.selectedGender) {
      return false;
    }

    // Qualification filter
    if (this.selectedQualification && cv.qualification !== this.selectedQualification) {
      return false;
    }

    // Max qualification filter
    if (this.selectedMaxQualification) {
      // Add qualification comparison logic here if needed
    }

    // Language filter
    if (this.selectedLanguages.length > 0) {
      // Add language matching logic when API supports it
    }

    return true;
  }

  // Reset filters
  resetFilters(): void {
    this.resetFilterState();
    this.filteredResumeData = [...this.resumeData];
    this.resumeService.setFilteredData([...this.resumeData], null);
    
    this.showInfoMessage('Filters Reset', 'All filters have been cleared');
  }

  // Reset CV data
  resetCVs(): void {
    this.clearExistingData();
    this.resetFilterState();
    
    this.showInfoMessage('Reset Complete', 'All CV data and filters have been cleared');
  }

  // Move to shortlisting
  moveToShortListing(): void {
    if (this.filteredResumeData.length === 0) {
      this.showWarningMessage('No Selection', 'Please select CVs to move to short listing');
      return;
    }

    if (!this.pdfId) {
      this.showErrorMessage('Error', 'No PDF ID found. Please upload a file first.');
      return;
    }

    this.saveFilteredResumes();
  }

  // Dropdown management
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.openDropdown = null;
  }

  toggleDropdown(dropdownName: string, event?: Event): void {
    event?.stopPropagation();
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }

  getSelectedLabel(options: readonly FilterOption[], value: string): string {
    return options.find(opt => opt.value === value)?.label || '';
  }

  selectOption(dropdownName: string, value: string): void {
    switch (dropdownName) {
      case 'nationality':
        this.selectedNationality = value;
        break;
      case 'minExperience':
        this.selectedMinExperience = value;
        break;
      case 'maxExperience':
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

  clearSelection(dropdownName: string): void {
    this.selectOption(dropdownName, '');
  }

  // Language management
  selectLanguage(value: string): void {
    this.tempSelectedLanguage = value;
  }

  clearLanguageSelection(): void {
    this.tempSelectedLanguage = '';
  }

  addLanguage(): void {
    if (this.tempSelectedLanguage && !this.selectedLanguages.includes(this.tempSelectedLanguage)) {
      this.selectedLanguages = [...this.selectedLanguages, this.tempSelectedLanguage];
      this.tempSelectedLanguage = '';
      this.showLanguageDropdown = false;
    }
  }

  removeLanguage(language: string): void {
    this.selectedLanguages = this.selectedLanguages.filter(lang => lang !== language);
  }

  // Qualification management
  addMaximumQualification(): void {
    this.showMaxQualification = true;
  }

  removeMaxQualification(): void {
    this.selectedMaxQualification = '';
    this.showMaxQualification = false;
  }

  // Private helper methods
  private setLoadingState(isUploading: boolean, progress: number = 0): void {
    this.loadingState$.next({ isUploading, uploadProgress: progress });
  }

  private handleUploadSuccess(response: UploadResumeResponse): void {
    try {
      if (response.data && response.pdf_id) {
        this.pdfId = response.pdf_id;
        this.resumeData = this.transformApiData(response.data);
        this.filteredResumeData = [...this.resumeData];
        
        this.resumeService.setResumeData(this.resumeData, this.pdfId);
        this.updateFilterOptions();
        
        this.showSuccessMessage(
          'File Processed Successfully',
          `Found ${this.resumeData.length} resumes in the P11 file`
        );
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Upload success handling error:', error);
      this.showErrorMessage('Processing Failed', 'Failed to process the uploaded file');
    }
  }

  private transformApiData(data: any[]): ResumeData[] {
    return data.map((item: any) => {
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
  }

  private handleUploadError(error: any): void {
    console.error('Upload error:', error);
    
    let errorMessage = 'Failed to upload file. Please try again.';
    
    if (error.status === 422) {
      errorMessage = 'The server could not process the file. Please check the file format and try again.';
      
      if (error.error?.detail) {
        console.error('422 Validation Error Details:', error.error.detail);
      }
    }
    
    this.showErrorMessage('Upload Failed', errorMessage);
  }

  private saveFilteredResumes(): void {
    if (!this.pdfId || this.filteredResumeData.length === 0) return;

    this.resumeService.saveFilteredResumes({
      pdf_id: this.pdfId,
      data: this.filteredResumeData
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('Save filtered response:', response);
        this.showSuccessMessage('Success', 'Filtered resumes moved to shortlisting');
      },
      error: (error) => {
        console.error('Save filtered error:', error);
        this.showErrorMessage('Save Failed', 'Failed to save filtered resumes');
      }
    });
  }

  private updateFilterOptions(): void {
    if (this.resumeData.length === 0) return;

    // Update nationality options
    const nationalities = [...new Set(this.resumeData.map(cv => cv.nationality))]
      .filter((nationality): nationality is string => Boolean(nationality))
      .map(nationality => ({ label: nationality, value: nationality }));
    
    this.dynamicNationalityOptions = [
      { label: 'All Nationalities', value: '' },
      ...nationalities
    ];

    // Update qualification options
    const qualifications = [...new Set(this.resumeData.map(cv => cv.qualification))]
      .filter((qualification): qualification is string => Boolean(qualification))
      .map(qualification => ({ label: qualification, value: qualification }));
    
    this.dynamicQualificationOptions = [
      { label: 'All Qualifications', value: '' },
      ...qualifications
    ];

    // Update gender options
    const genders = [...new Set(this.resumeData.map(cv => cv.gender))]
      .filter((gender): gender is string => Boolean(gender))
      .map(gender => ({ label: gender, value: gender }));
    
    this.dynamicGenderOptions = [
      { label: 'Select Gender', value: '' },
      ...genders
    ];
  }

  private saveFilterState(): void {
    const filterState = { ...this.filterState };
    this.resumeService.setFilteredData(this.filteredResumeData, filterState);
  }

  private restoreFilterState(savedState: FilterState): void {
    this.filterState = { ...savedState };
  }

  private resetFilterState(): void {
    this.filterState = {
      nationality: '',
      minExperience: '',
      maxExperience: '',
      gender: '',
      qualification: '',
      maxQualification: '',
      languages: [],
      showMaxQualification: false,
      showLanguageDropdown: false,
      tempSelectedLanguage: '',
      ageRange: [...AGE_RANGE_DEFAULT],
      openDropdown: null
    };
  }

  // Message helpers
  private showSuccessMessage(summary: string, detail: string): void {
    this.messageService.add({ severity: 'success', summary, detail });
  }

  private showInfoMessage(summary: string, detail: string): void {
    this.messageService.add({ severity: 'info', summary, detail });
  }

  private showWarningMessage(summary: string, detail: string): void {
    this.messageService.add({ severity: 'warn', summary, detail });
  }

  private showErrorMessage(summary: string, detail: string): void {
    this.messageService.add({ severity: 'error', summary, detail });
  }
}