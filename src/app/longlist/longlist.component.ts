import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, BehaviorSubject } from 'rxjs';

// Services
import { SessionTimerService } from '../services/session-timer.service';
import { AuthService } from '../services/auth.service';
import { ResumeService } from '../services/resume.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';

// Navbar Component Import
import { NavbarComponent } from '../shared/navbar/navbar.component';

// Constants
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_FILE_TYPE = 'application/pdf';

// Qualification hierarchy for proper filtering
const QUALIFICATION_HIERARCHY: Record<string, number> = {
  'Diploma': 1,
  'Bachelor Degree': 2,
  'Bachelor': 2,
  'Bachelors Degree': 2,
  'Masters Degree': 3,
  'Master Degree': 3,
  'Masters': 3,
  'Master': 3,
  'PhD': 4,
  'Doctorate': 4,
  'Post-Doctorate': 5,
  'Post Graduate': 3,
  'Graduate': 2,
  'Undergraduate': 2
};

// Helper function to normalize qualification names
function normalizeQualification(qualification: string): string {
  if (!qualification) return '';
  
  const normalized = qualification.trim().toLowerCase();
  
  const mappings: Record<string, string> = {
    'bachelor': 'Bachelor Degree',
    'bachelors': 'Bachelor Degree',
    'bachelor degree': 'Bachelor Degree',
    'bachelors degree': 'Bachelor Degree',
    'b.sc': 'Bachelor Degree',
    'bsc': 'Bachelor Degree',
    'b.a': 'Bachelor Degree',
    'ba': 'Bachelor Degree',
    'b.tech': 'Bachelor Degree',
    'btech': 'Bachelor Degree',
    'b.e': 'Bachelor Degree',
    'be': 'Bachelor Degree',
    'master': 'Masters Degree',
    'masters': 'Masters Degree',
    'master degree': 'Masters Degree',
    'masters degree': 'Masters Degree',
    'm.sc': 'Masters Degree',
    'msc': 'Masters Degree',
    'm.a': 'Masters Degree',
    'ma': 'Masters Degree',
    'm.tech': 'Masters Degree',
    'mtech': 'Masters Degree',
    'm.e': 'Masters Degree',
    'me': 'Masters Degree',
    'mba': 'Masters Degree',
    'phd': 'PhD',
    'ph.d': 'PhD',
    'doctorate': 'PhD',
    'doctoral': 'PhD',
    'diploma': 'Diploma',
    'post graduate': 'Masters Degree',
    'postgraduate': 'Masters Degree',
    'graduate': 'Bachelor Degree',
    'undergraduate': 'Bachelor Degree'
  };
  
  return mappings[normalized] || qualification;
}

// Helper function to get qualification level
function getQualificationLevel(qualification: string): number {
  const normalized = normalizeQualification(qualification);
  return QUALIFICATION_HIERARCHY[normalized] || 0;
}

// New interfaces for the updated API structure
interface ApiResumeData {
  "CV ID": string;
  "Name": string;
  "Highest Degree": string;
  "YOE": number;
  "Gender": string;
  "Nationality": string;
  "Employment History": string;
}

interface ApiUploadResponse {
  message: string;
  pdf_id: number;
  rows: number;
  data: ApiResumeData[];
}

interface SaveFilteredRequest {
  pdf_id: number;
  min_experience: number;
  min_degree: string;
  data: ApiResumeData[];
}

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
  showMaxQualification: boolean;
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
    ProgressBarModule,
    NavbarComponent
  ],
  templateUrl: './longlist.component.html',
  styleUrls: ['./longlist.component.scss']
})
export class LonglistComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private readonly messageService = inject(MessageService);
  private readonly sessionTimerService = inject(SessionTimerService);
  private readonly authService = inject(AuthService);
  private readonly resumeService = inject(ResumeService);
  private readonly router = inject(Router);

  // Reactive subjects
  private readonly destroy$ = new Subject<void>();
  private readonly loadingState$ = new BehaviorSubject<LoadingState>({
    isUploading: false,
    uploadProgress: 0
  });

  // Public observables
  readonly loading$ = this.loadingState$.asObservable();

  // Data - using new API structure
  originalApiData: ApiResumeData[] = [];
  filteredApiData: ApiResumeData[] = [];
  pdfId: number | null = null;
  selectedFile: File | null = null;
  uploadSubscription: any = null;

  // Dynamic filter options (populated from API data)
  dynamicNationalityOptions: FilterOption[] = [];
  dynamicQualificationOptions: FilterOption[] = [];
  dynamicGenderOptions: FilterOption[] = [];

  // Experience options for dropdowns
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

  // Filter State
  private filterState: FilterState = {
    nationality: '',
    minExperience: '',
    maxExperience: '',
    gender: '',
    qualification: '',
    maxQualification: '',
    showMaxQualification: false,
    openDropdown: null
  };

  // Getters for template access
  get selectedNationality(): string { return this.filterState.nationality; }
  get selectedMinExperience(): string { return this.filterState.minExperience; }
  get selectedMaxExperience(): string { return this.filterState.maxExperience; }
  get selectedGender(): string { return this.filterState.gender; }
  get selectedQualification(): string { return this.filterState.qualification; }
  get selectedMaxQualification(): string { return this.filterState.maxQualification; }
  get showMaxQualification(): boolean { return this.filterState.showMaxQualification; }
  get openDropdown(): string | null { return this.filterState.openDropdown; }

  // Setters for template access
  set selectedNationality(value: string) { 
    this.filterState.nationality = value; 
    this.applyFilters();
    this.saveState();
  }
  set selectedMinExperience(value: string) { 
    this.filterState.minExperience = value; 
    this.applyFilters();
    this.saveState();
  }
  set selectedMaxExperience(value: string) { 
    this.filterState.maxExperience = value; 
    this.applyFilters();
    this.saveState();
  }
  set selectedGender(value: string) { 
    this.filterState.gender = value; 
    this.applyFilters();
    this.saveState();
  }
  set selectedQualification(value: string) { 
    this.filterState.qualification = value; 
    this.applyFilters();
    this.saveState();
  }
  set selectedMaxQualification(value: string) { 
    this.filterState.maxQualification = value; 
    this.applyFilters();
    this.saveState();
  }
  set showMaxQualification(value: boolean) { this.filterState.showMaxQualification = value; }
  set openDropdown(value: string | null) { this.filterState.openDropdown = value; }

  // Loading state getters
  get isUploading(): boolean { return this.loadingState$.value.isUploading; }
  get uploadProgress(): number { return this.loadingState$.value.uploadProgress; }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    // Cancel any ongoing upload
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
    }
    
    // Save state before component destruction to preserve user's work
    if (this.originalApiData.length > 0 && this.pdfId) {
      this.saveState();
      console.log('State preserved on component destroy');
    }
    
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingState$.complete();
  }

  private initializeComponent(): void {
    this.sessionTimerService.startSessionTimer();
    
    // Check if we have saved state to restore
    if (this.resumeService.hasLonglistData()) {
      this.restoreState();
    } else {
      this.initializeEmptyState();
    }
  }

  private restoreState(): void {
    try {
      console.log('=== RESTORING LONGLIST STATE ===');
      
      // Restore data
      this.originalApiData = this.resumeService.getCurrentOriginalApiData();
      this.filteredApiData = this.resumeService.getCurrentFilteredApiData();
      this.pdfId = this.resumeService.getCurrentPdfId();
      
      // Restore dynamic filter options
      const dynamicOptions = this.resumeService.getCurrentDynamicFilterOptions();
      this.dynamicNationalityOptions = dynamicOptions.nationalities || [];
      this.dynamicQualificationOptions = dynamicOptions.qualifications || [];
      this.dynamicGenderOptions = dynamicOptions.genders || [];
      
      // Restore file information
      const fileInfo = this.resumeService.getCurrentSelectedFileInfo();
      if (fileInfo) {
        // Create a mock file object to show in the UI
        this.selectedFile = new File([], fileInfo.name, { type: 'application/pdf' });
        // Store the original file size for display
        Object.defineProperty(this.selectedFile, 'size', {
          value: fileInfo.size,
          writable: false
        });
      }
      
      // Restore filter state
      const savedFilterState = this.resumeService.getCurrentLonglistFilterState();
      if (savedFilterState) {
        this.restoreFilterState(savedFilterState);
      } else {
        this.resetFilterState();
      }
      
      console.log('State restored successfully:', {
        originalDataCount: this.originalApiData.length,
        filteredDataCount: this.filteredApiData.length,
        pdfId: this.pdfId,
        hasFilters: !!savedFilterState,
        filterState: savedFilterState
      });
      
      const hasFilters = this.resumeService.hasLonglistFilters();
      const statusMessage = hasFilters 
        ? `Restored ${this.originalApiData.length} CVs with ${this.filteredApiData.length} shown after applied filters`
        : `Restored ${this.originalApiData.length} CVs (no filters applied)`;
      
      this.showInfoMessage('Welcome Back!', statusMessage);
      
    } catch (error) {
      console.error('Error restoring state:', error);
      this.showErrorMessage('Restoration Failed', 'Failed to restore previous data');
      this.initializeEmptyState();
    }
  }

  private initializeEmptyState(): void {
    this.originalApiData = [];
    this.filteredApiData = [];
    this.pdfId = null;
    this.resetFilterState();
    this.updateFilterOptions();
  }

  // Check if the current file is restored from session
  isRestoredFile(): boolean {
    return this.selectedFile !== null && 
           this.originalApiData.length > 0 && 
           !this.isUploading &&
           this.resumeService.getCurrentSelectedFileInfo() !== null;
  }

  private restoreFilterState(savedState: any): void {
    this.filterState = { ...savedState };
  }

  private saveState(): void {
    if (this.originalApiData.length > 0 && this.pdfId) {
      // Save current filter state
      this.resumeService.setLonglistFilteredData(this.filteredApiData, this.filterState);
      
      // Debug logging for state preservation
      console.log('State saved:', {
        originalCount: this.originalApiData.length,
        filteredCount: this.filteredApiData.length,
        appliedFilters: {
          nationality: this.selectedNationality,
          minExperience: this.selectedMinExperience,
          maxExperience: this.selectedMaxExperience,
          gender: this.selectedGender,
          qualification: this.selectedQualification,
          maxQualification: this.selectedMaxQualification
        }
      });
    }
  }

  handleFileUpload(file: File): void {
    if (!this.validateFile(file)) {
      return;
    }

    this.clearExistingData();
    this.selectedFile = file;
    this.uploadFile(file);
  }

  private validateFile(file: File): boolean {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      this.showErrorMessage('File Size Error', 'File size must be less than 200MB');
      return false;
    }

    // Check file type by MIME type
    if (file.type !== ALLOWED_FILE_TYPE) {
      this.showErrorMessage('File Type Error', 'Only PDF files are allowed. Please select a valid PDF file.');
      return false;
    }

    // Additional check by file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      this.showErrorMessage('File Type Error', 'File must have a .pdf extension. Please select a valid PDF file.');
      return false;
    }

    // Check if file is empty
    if (file.size === 0) {
      this.showErrorMessage('File Error', 'Selected file is empty. Please select a valid PDF file.');
      return false;
    }

    return true;
  }

  private clearExistingData(): void {
    this.originalApiData = [];
    this.filteredApiData = [];
    this.pdfId = null;
    this.resetFilterState();
    this.updateFilterOptions();
    
    // Clear state from service
    this.resumeService.clearLonglistData();
  }

  private uploadFile(file: File): void {
    this.setLoadingState(true, 0);
    
    // Simulate progress since API doesn't provide real progress
    const progressInterval = this.simulateProgress();
    
    this.uploadSubscription = this.resumeService.uploadResume(file)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          this.uploadSubscription = null;
          this.handleUploadSuccess(response);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.uploadSubscription = null;
          this.handleUploadError(error);
        }
      });
  }

  private simulateProgress(): number {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20; // Random increment
      if (progress >= 90) {
        progress = 90; // Stop at 90% until real response
        clearInterval(interval);
      }
      this.setLoadingState(true, progress);
    }, 300);
    
    // Store interval so we can clear it if component is destroyed
    setTimeout(() => clearInterval(interval), 10000); // Clear after 10 seconds max
    
    return interval as any; // Return interval ID for manual clearing
  }

  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.handleFileUpload(file);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  removeSelectedFile(): void {
    // Cancel ongoing upload if any
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
      this.showInfoMessage('Upload Cancelled', 'File upload has been cancelled');
    }
    
    // Reset loading state
    this.setLoadingState(false, 0);
    
    // Clear existing data and reset table
    this.clearExistingData();
    
    // Remove selected file
    this.selectedFile = null;
  }

  applyFilters(): void {
    if (this.originalApiData.length === 0) {
      this.filteredApiData = [];
      return;
    }

    this.filteredApiData = this.originalApiData.filter(cv => this.matchesFilters(cv));
  }

  private matchesFilters(cv: ApiResumeData): boolean {
    // Nationality filter
    if (this.selectedNationality && cv.Nationality) {
      const cvNationalities = this.parseNationalities(cv.Nationality);
      if (!cvNationalities.some(nat => nat.toLowerCase().includes(this.selectedNationality.toLowerCase()))) {
        return false;
      }
    }

    // Experience filter
    const cvExperience = cv.YOE || 0;
    if (this.selectedMinExperience) {
      const minExp = parseInt(this.selectedMinExperience);
      if (cvExperience < minExp) {
        return false;
      }
    }

    if (this.selectedMaxExperience) {
      const maxExp = parseInt(this.selectedMaxExperience);
      if (maxExp < 10 && cvExperience > maxExp) { // 10+ means no upper limit
        return false;
      }
    }

    // Gender filter
    if (this.selectedGender && cv.Gender) {
      if (cv.Gender.toLowerCase() !== this.selectedGender.toLowerCase()) {
        return false;
      }
    }

    // Qualification filter (minimum)
    if (this.selectedQualification && cv["Highest Degree"]) {
      const cvQualLevel = getQualificationLevel(cv["Highest Degree"]);
      const minQualLevel = getQualificationLevel(this.selectedQualification);
      if (cvQualLevel < minQualLevel) {
        return false;
      }
    }

    // Maximum qualification filter
    if (this.selectedMaxQualification && cv["Highest Degree"]) {
      const cvQualLevel = getQualificationLevel(cv["Highest Degree"]);
      const maxQualLevel = getQualificationLevel(this.selectedMaxQualification);
      if (cvQualLevel > maxQualLevel) {
        return false;
      }
    }

    return true;
  }

  private parseNationalities(nationality: string): string[] {
    if (!nationality) return [];
    
    // Handle array-like string format: "['India']" or "['India', 'Nepal']"
    if (nationality.startsWith('[') && nationality.endsWith(']')) {
      try {
        const parsed = nationality.replace(/'/g, '"');
        return JSON.parse(parsed);
      } catch {
        // If parsing fails, treat as single nationality
        return [nationality.replace(/[\[\]']/g, '')];
      }
    }
    
    // Handle comma-separated values
    return nationality.split(',').map(nat => nat.trim());
  }

  resetFilters(): void {
    this.resetFilterState();
    this.applyFilters();
    this.saveState();
    this.showInfoMessage('Filters Reset', 'All filters have been cleared');
  }

  resetCVs(): void {
    this.clearExistingData();
    this.selectedFile = null;
    this.showInfoMessage('Reset Complete', 'All CV data and saved state have been cleared');
  }

  moveToShortListing(): void {
    if (!this.pdfId) {
      this.showErrorMessage('Error', 'No PDF ID available. Please upload a file first.');
      return;
    }

    if (this.filteredApiData.length === 0) {
      this.showErrorMessage('Error', 'No filtered data available to move to shortlist.');
      return;
    }

    const request: SaveFilteredRequest = {
      pdf_id: this.pdfId,
      min_experience: parseInt(this.selectedMinExperience) || 0,
      min_degree: this.selectedQualification || '',
      data: this.filteredApiData
    };

    // Detailed logging for debugging
    console.log('=== MOVE TO SHORTLIST - DETAILED LOG ===');
    console.log('PDF ID:', this.pdfId);
    console.log('Selected Min Experience:', this.selectedMinExperience, '→ Parsed:', parseInt(this.selectedMinExperience) || 0);
    console.log('Selected Min Degree:', this.selectedQualification);
    console.log('Original API Data Count:', this.originalApiData.length);
    console.log('Filtered API Data Count:', this.filteredApiData.length);
    console.log('Applied Filters:', {
      nationality: this.selectedNationality,
      minExperience: this.selectedMinExperience,
      maxExperience: this.selectedMaxExperience,
      gender: this.selectedGender,
      qualification: this.selectedQualification,
      maxQualification: this.selectedMaxQualification
    });
    console.log('Sample of filtered data (first 3 records):');
    console.log(JSON.stringify(this.filteredApiData.slice(0, 3), null, 2));
    console.log('Complete request payload being sent to API:');
    console.log(JSON.stringify(request, null, 2));
    console.log('API Endpoint: /api/resume/save-filtered (POST)');
    console.log('========================================');

    this.resumeService.saveFilteredResumes(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('=== API RESPONSE ===');
          console.log('Save filtered response:', response);
          console.log('===================');
          
          // Save current state before navigation to preserve it for return
          this.saveState();
          console.log('State preserved before navigation to shortlist');
          
          this.showSuccessMessage('Success', 'Filtered data saved successfully - State preserved for return');
          this.router.navigate(['/shortlist']);
        },
        error: (error) => {
          console.error('=== API ERROR ===');
          console.error('Error saving filtered data:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          console.error('================');
          this.showErrorMessage('Error', 'Failed to save filtered data');
        }
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.openDropdown = null;
  }

  toggleDropdown(dropdownName: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }

  getSelectedLabel(options: readonly FilterOption[], value: string): string {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
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

  addMaximumQualification(): void {
    this.showMaxQualification = true;
    this.saveState();
  }

  removeMaxQualification(): void {
    this.showMaxQualification = false;
    this.selectedMaxQualification = '';
    this.applyFilters();
    this.saveState();
  }

  private setLoadingState(isUploading: boolean, progress: number = 0): void {
    this.loadingState$.next({ isUploading, uploadProgress: progress });
  }

  private handleUploadSuccess(response: ApiUploadResponse): void {
    console.log('Upload successful:', response);
    
    // Complete progress bar
    this.setLoadingState(true, 100);
    
    this.originalApiData = response.data || [];
    this.filteredApiData = [...this.originalApiData];
    this.pdfId = response.pdf_id;
    
    this.updateFilterOptions();
    this.applyFilters();
    
    // Save initial state to service
    const dynamicOptions = {
      nationalities: this.dynamicNationalityOptions,
      qualifications: this.dynamicQualificationOptions,
      genders: this.dynamicGenderOptions
    };
    
    // Save file info
    const fileInfo = this.selectedFile ? {
      name: this.selectedFile.name,
      size: this.selectedFile.size
    } : undefined;
    
    this.resumeService.setLonglistData(this.originalApiData, this.pdfId, dynamicOptions, fileInfo);
    
    this.showSuccessMessage(
      'Upload Successful',
      `${response.rows} CVs processed successfully`
    );
    
    // Hide progress bar after a short delay to show completion
    setTimeout(() => {
      this.setLoadingState(false, 0);
    }, 1000);
  }

  private handleUploadError(error: any): void {
    console.error('Upload failed:', error);
    
    // Complete progress bar to show it's finished (even though it failed)
    this.setLoadingState(true, 100);
    
    let errorMessage = 'An error occurred during upload';
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    this.showErrorMessage('Upload Failed', errorMessage);
    
    // Hide progress bar after a short delay to show completion
    setTimeout(() => {
      this.setLoadingState(false, 0);
      // Remove the selected file on error
      this.selectedFile = null;
    }, 1500);
  }

  private updateFilterOptions(): void {
    if (this.originalApiData.length === 0) {
      this.dynamicNationalityOptions = [];
      this.dynamicQualificationOptions = [];
      this.dynamicGenderOptions = [];
      return;
    }

    // Extract unique nationalities
    const nationalities = new Set<string>();
    this.originalApiData.forEach(cv => {
      if (cv.Nationality) {
        const parsedNats = this.parseNationalities(cv.Nationality);
        parsedNats.forEach(nat => nationalities.add(nat));
      }
    });
    this.dynamicNationalityOptions = [
      { label: 'All Nationalities', value: '' },
      ...Array.from(nationalities).sort().map(nat => ({ label: nat, value: nat }))
    ];

    // Extract unique qualifications
    const qualifications = new Set<string>();
    this.originalApiData.forEach(cv => {
      if (cv["Highest Degree"]) {
        qualifications.add(cv["Highest Degree"]);
      }
    });
    this.dynamicQualificationOptions = [
      { label: 'All Qualifications', value: '' },
      ...Array.from(qualifications).sort().map(qual => ({ label: qual, value: qual }))
    ];

    // Extract unique genders
    const genders = new Set<string>();
    this.originalApiData.forEach(cv => {
      if (cv.Gender) {
        genders.add(cv.Gender);
      }
    });
    this.dynamicGenderOptions = [
      { label: 'Select Gender', value: '' },
      ...Array.from(genders).sort().map(gender => ({ label: gender, value: gender }))
    ];
  }

  private resetFilterState(): void {
    this.filterState = {
      nationality: '',
      minExperience: '',
      maxExperience: '',
      gender: '',
      qualification: '',
      maxQualification: '',
      showMaxQualification: false,
      openDropdown: null
    };
  }

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

  // Helper method to format nationality for display
  formatNationalityDisplay(nationality: string): string {
    if (!nationality) return '';
    
    // Handle array-like string format: "['India']" or "['India', 'Nepal']"
    if (nationality.startsWith('[') && nationality.endsWith(']')) {
      try {
        const parsed = nationality.replace(/'/g, '"');
        const nationalityArray = JSON.parse(parsed);
        return nationalityArray.join(', ');
      } catch {
        // If parsing fails, clean up manually
        return nationality.replace(/[\[\]']/g, '');
      }
    }
    
    return nationality;
  }
}