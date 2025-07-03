import { Component, OnInit, OnDestroy, HostListener, inject, ChangeDetectorRef } from '@angular/core';
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
  progressText: string;
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
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  // Reactive subjects
  private readonly destroy$ = new Subject<void>();
  private readonly loadingState$ = new BehaviorSubject<LoadingState>({
    isUploading: false,
    uploadProgress: 0,
    progressText: ''
  });

  // Loading state for move to shortlist operation
  private _isMovingToShortlist = false;

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
  get uploadProgressText(): string { return this.loadingState$.value.progressText; }
  get isMovingToShortlist(): boolean { return this._isMovingToShortlist; }

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
      
      const hasFilters = this.resumeService.hasLonglistFilters();
      const statusMessage = hasFilters 
        ? `Restored ${this.originalApiData.length} CVs with ${this.filteredApiData.length} shown after applied filters`
        : `Restored ${this.originalApiData.length} CVs (no filters applied)`;
      
      this.showInfoMessage('Welcome Back!', statusMessage);
      
    } catch (error) {
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
    this.resumeService.clearLonglistData();
  }

  private uploadFile(file: File): void {
    // Check authentication before starting upload
    if (!this.authService.isAuthenticated()) {
      this.showErrorMessage('Authentication Required', 'Please login to upload files.');
      return;
    }
    
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
    let stage = 0;
    const stages = [
      { max: 20, text: 'Validating file...' },
      { max: 40, text: 'Uploading to server...' },
      { max: 60, text: 'Processing PDF content...' },
      { max: 80, text: 'Extracting CV data...' },
      { max: 95, text: 'Finalizing results...' }
    ];
    
    const interval = setInterval(() => {
      // Move to next stage if current stage is complete
      if (progress >= stages[stage].max && stage < stages.length - 1) {
        stage++;
      }
      
      // Calculate progress within current stage
      const stageStart = stage === 0 ? 0 : stages[stage - 1].max;
      const stageEnd = stages[stage].max;
      const stageProgress = Math.min(progress - stageStart, stageEnd - stageStart);
      
      // Add small random increment to show activity
      const increment = Math.random() * 3 + 1;
      progress = Math.min(progress + increment, 95); // Cap at 95% until real response
      
      // Update loading state with current stage text
      this.setLoadingState(true, progress, stages[stage].text);
      
      // Stop if we've reached the final stage and 95%
      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 500); // Slower updates for more realistic feel
    
    // Store interval so we can clear it if component is destroyed
    setTimeout(() => clearInterval(interval), 30000); // Clear after 30 seconds max
    
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
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
      return;
    }

    // Create a new array reference to ensure change detection
    const filtered = this.originalApiData.filter(cv => this.matchesFilters(cv));
    this.filteredApiData = filtered.map(item => ({ ...item }));
    
    // Force change detection
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
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

  private parseNationalities(nationality: any): string[] {
    if (!nationality) return [];
    if (Array.isArray(nationality)) {
      return nationality.map(String);
    }
    if (typeof nationality === 'string') {
      // Handle array-like string format: "['India']" or "['India', 'Nepal']"
      if (nationality.startsWith('[') && nationality.endsWith(']')) {
        try {
          const parsed = nationality.replace(/'/g, '"');
          const nationalityArray = JSON.parse(parsed);
          return Array.isArray(nationalityArray) ? nationalityArray.map(String) : [String(nationalityArray)];
        } catch {
          // If parsing fails, clean up manually
          return [nationality.replace(/[\[\]']/g, '')];
        }
      }
      return [nationality];
    }
    // Fallback for any other type
    return [String(nationality)];
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

    // Set loading state
    this._isMovingToShortlist = true;

    const request: SaveFilteredRequest = {
      pdf_id: this.pdfId,
      min_experience: parseInt(this.selectedMinExperience) || 0,
      min_degree: this.selectedQualification || '',
      data: this.filteredApiData
    };

    this.resumeService.saveFilteredResumes(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Save current state before navigation to preserve it for return
          this.saveState();
          this.showSuccessMessage('Success', 'Filtered data saved successfully');
          this.router.navigate(['/shortlist']);
        },
        error: (error) => {
          this.showErrorMessage('Error', 'Failed to save filtered data');
          // Reset loading state on error
          this._isMovingToShortlist = false;
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

  private setLoadingState(isUploading: boolean, progress: number = 0, progressText: string = ''): void {
    this.loadingState$.next({ isUploading, uploadProgress: progress, progressText });
  }

  private handleUploadSuccess(response: ApiUploadResponse): void {
    // Debug: Log the actual API response
    console.log('API upload response:', response);
    // Debug: Log the type of response.data
    console.log('Type of response.data:', typeof response.data, response.data);
    // Complete progress bar
    this.setLoadingState(true, 100);

    // Guard: prevent double error handling
    if ((this as any)._uploadHandled) {
      console.warn('Upload already handled, skipping.');
      return;
    }

    // Check for wrong file format error
    if (response.message && response.message.toLowerCase().includes('wrong file uploaded')) {
      console.warn('Wrong file uploaded detected in response.message');
      (this as any)._uploadHandled = true;
      this.handleUploadError({ 
        message: 'Make sure the uploaded file is in P11 format',
        status: 400 
      });
      return;
    }

    // If response.data is a string, try to parse it
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        console.warn('Failed to parse response.data as JSON');
        (this as any)._uploadHandled = true;
        this.handleUploadError({ message: 'Upload failed. Please check your file and try again.' });
        return;
      }
    }

    // Validate response data
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.warn('Response data is missing, not an array, or empty:', response.data);
      (this as any)._uploadHandled = true;
      this.handleUploadError({ message: 'Upload failed. Please check your file and try again.' });
      return;
    }

    // Only wrap the code that can throw
    try {
      // Step 1: Clear existing data completely
      this.originalApiData = [];
      this.filteredApiData = [];
      this.changeDetectorRef.detectChanges();

      // Step 2: Create deep copies with new references
      const originalDataCopy = response.data.map(item => ({ ...item }));
      const filteredDataCopy = response.data.map(item => ({ ...item }));

      // Step 3: Set data with proper timing
      this.originalApiData = originalDataCopy;
      this.filteredApiData = filteredDataCopy;
      this.pdfId = response.pdf_id;

      // Step 4: Force immediate change detection
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();

      // Step 5: Update filter options
      this.updateFilterOptionsFromResponseData(response.data);

      // Step 6: Force change detection after filter options
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();

      // Step 7: Save state to service
      const dynamicOptions = {
        nationalities: this.dynamicNationalityOptions,
        qualifications: this.dynamicQualificationOptions,
        genders: this.dynamicGenderOptions
      };

      const fileInfo = this.selectedFile ? {
        name: this.selectedFile.name,
        size: this.selectedFile.size
      } : undefined;

      this.resumeService.setLonglistData(response.data, this.pdfId, dynamicOptions, fileInfo);

      this.showSuccessMessage(
        'Upload Successful',
        `${response.rows} CVs processed successfully`
      );

      // Step 8: Multiple change detection cycles with delays
      setTimeout(() => {
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      }, 50);

      setTimeout(() => {
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      }, 150);

      setTimeout(() => {
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      }, 300);

      // Step 9: Force table refresh after all changes
      setTimeout(() => {
        this.forceTableRefresh();
      }, 400);

      // Step 10: Ensure table is properly initialized
      setTimeout(() => {
        this.ensureTableInitialization();
      }, 500);

      // Step 12: Handle PrimeNG table issues
      setTimeout(() => {
        this.handlePrimeNGTableIssues();
      }, 700);

      // Step 13: Ensure component state synchronization
      setTimeout(() => {
        this.ensureComponentStateSync();
      }, 800);

      // Step 15: Handle zone.js issues
      setTimeout(() => {
        this.handleZoneIssues();
      }, 1000);

    } catch (error) {
      console.error('Exception thrown in handleUploadSuccess try block:', error);
      (this as any)._uploadHandled = true;
      this.handleUploadError({ message: 'Upload failed. Please check your file and try again.' });
      return;
    }

    (this as any)._uploadHandled = true;
    // Hide progress bar after a short delay
    setTimeout(() => {
      this.setLoadingState(false, 0);
    }, 1000);
  }

  private handleUploadError(error: any): void {
    console.error('Upload error:', error); // DEBUG LOG
    // Complete progress bar to show it's finished (even though it failed)
    this.setLoadingState(true, 100);
    
    let errorMessage = 'An error occurred during upload';
    let errorSummary = 'Upload Failed';

    // Robustly check for P11 format error in all possible error fields
    const errorText = [
      error?.message,
      error?.error,
      error?.error?.message,
      error?.error?.detail,
      error?.statusText
    ]
      .filter(Boolean)
      .map(String)
      .join(' ')
      .toLowerCase();

    if (
      error?.status === 400 &&
      (errorText.includes('wrong file uploaded') || errorText.includes('p11') || errorText.includes('valid resume'))
    ) {
      errorSummary = 'Invalid File Format';
      errorMessage = 'Make sure the uploaded file is in P11 format';
    } else if (error?.status === 401) {
      errorSummary = 'Authentication Failed';
      errorMessage = 'Your session has expired. Please login again.';
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    } else if (error?.status === 403) {
      errorSummary = 'Access Denied';
      errorMessage = 'You do not have permission to upload files.';
    } else if (error?.status === 413) {
      errorSummary = 'File Too Large';
      errorMessage = 'The file size exceeds the maximum allowed limit.';
    } else if (error?.status === 415) {
      errorSummary = 'Invalid File Type';
      errorMessage = 'Only PDF files are allowed.';
    } else if (error?.status === 0 || error?.status === 504 || error?.status === 408) {
      errorSummary = 'Connection Timeout';
      errorMessage = 'The upload took too long or the server is not responding. Please try again with a smaller file or check your internet connection.';
    } else if (error?.status === 500) {
      errorSummary = 'Server Error';
      errorMessage = 'The server encountered an error processing your file. Please try again.';
    } else if (error?.status === 502 || error?.status === 503) {
      errorSummary = 'Server Unavailable';
      errorMessage = 'The server is temporarily unavailable. Please try again later.';
    } else if (errorText.includes('no authentication token')) {
      errorSummary = 'Authentication Required';
      errorMessage = 'Please login to upload files.';
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    this.showErrorMessage(errorSummary, errorMessage);
    
    // Hide progress bar after a short delay to show completion
    setTimeout(() => {
      this.setLoadingState(false, 0);
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

  private updateFilterOptionsFromResponseData(data: ApiResumeData[]): void {
    if (data.length === 0) {
      this.dynamicNationalityOptions = [];
      this.dynamicQualificationOptions = [];
      this.dynamicGenderOptions = [];
      return;
    }

    // Extract unique nationalities
    const nationalities = new Set<string>();
    data.forEach(cv => {
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
    data.forEach(cv => {
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
    data.forEach(cv => {
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
  formatNationalityDisplay(nationality: any): string {
    if (nationality == null) return '';
    if (Array.isArray(nationality)) {
      return nationality.join(', ');
    }
    if (typeof nationality === 'string') {
      // Handle array-like string format: "['India']" or "['India', 'Nepal']"
      if (nationality.startsWith('[') && nationality.endsWith(']')) {
        try {
          const parsed = nationality.replace(/'/g, '"');
          const nationalityArray = JSON.parse(parsed);
          return Array.isArray(nationalityArray) ? nationalityArray.join(', ') : String(nationalityArray);
        } catch {
          // If parsing fails, clean up manually
          return nationality.replace(/[\[\]']/g, '');
        }
      }
      return nationality;
    }
    // Fallback for any other type
    return String(nationality);
  }

  // Helper method to format YOE for display
  formatYOE(yoe: number | null | undefined): string {
    if (yoe === null || yoe === undefined) {
      return 'N/A';
    }
    return yoe.toString();
  }

  // Helper method to force table refresh
  private forceTableRefresh(): void {
    // Temporarily clear and restore data to force table update
    const currentData = [...this.filteredApiData];
    this.filteredApiData = [];
    this.changeDetectorRef.detectChanges();
    
    // Restore data with new references
    this.filteredApiData = currentData.map(item => ({ ...item }));
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  // Helper method to ensure table is properly initialized
  private ensureTableInitialization(): void {
    // Force multiple change detection cycles to ensure table is fully updated
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
    
    // Additional cycle after a brief delay
    setTimeout(() => {
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    }, 10);
  }

  // Helper method to validate data is properly set
  private validateDataSetup(): void {}

  // Helper method to handle PrimeNG table issues
  private handlePrimeNGTableIssues(): void {
    // Force table to recognize new data by triggering multiple change detection cycles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      }, i * 50);
    }
  }

  // Helper method to ensure component state synchronization
  private ensureComponentStateSync(): void {
    // Ensure filtered data matches original data if no filters are applied
    if (this.filteredApiData.length === 0 && this.originalApiData.length > 0) {
      this.filteredApiData = this.originalApiData.map(item => ({ ...item }));
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    }
  }

  // Helper method to handle zone.js issues
  private handleZoneIssues(): void {
    // Force zone.js to recognize changes by triggering multiple async operations
    Promise.resolve().then(() => {
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    });
    
    setTimeout(() => {
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    }, 0);
  }
}