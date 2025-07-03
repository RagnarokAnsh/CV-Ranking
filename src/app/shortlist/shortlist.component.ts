import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Subscription, BehaviorSubject } from 'rxjs';

// Services
import { ResumeService, ApiResumeData, ShortlistResponse } from '../services/resume.service';
import { SessionTimerService } from '../services/session-timer.service';
import { AuthService } from '../services/auth.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Navbar Component Import
import { NavbarComponent } from '../shared/navbar/navbar.component';

// Constants
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain'];
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.txt'];
const DEFAULT_WEIGHTS = { experience: 0.3, qualifications: 0.3, skills: 0.4 };

interface FilterOption {
  label: string;
  value: string;
}

// Interface for shortlisted results from API (matching actual API response)
interface ShortlistedCandidate {
  Rank: number;
  CV: string;
  "Applicant Name": string;
  "Highest Degree": string;
  YOE: number;
  "Final Score": number;
  "Employment History": string;
  Gender: string;
  Nationality: string;
}

// Interface for table display
interface TableRowData {
  cvId: string;
  name: string;
  highestDegree: string;
  yoe: number;
  gender: string;
  nationality: string;
  rank?: number;
  finalScore?: number | string;
  employmentHistory?: string;
}

// Enhanced state management interfaces
interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  canCancel: boolean;
  progressText: string;
}

interface FilterState {
  minYearsExperience: number;
  requiredDegree: string;
  genderFilter: string;
  nationality: string;
  maxYearsExperience: number | null;
  maxQualification: string;
}

interface WeightState {
  experience: number;
  qualifications: number;
  skills: number;
  validationError: string;
}

interface FormState {
  selectedJobTemplate: string;
  searchQuery: string;
  searchOperator: string;
  selectedFile: File | null;
  fileValidationError: string;
}

interface DialogState {
  employment: {
    visible: boolean;
    candidateName: string;
    history: string;
  };
  jobDescription: {
    visible: boolean;
  };
}

interface ComponentState {
  isLoading: boolean;
  isSubmitting: boolean;
  hasData: boolean;
  hasRankings: boolean;
  jobDescriptionContent: string;
  filteredApiData: ApiResumeData[];
  tableData: TableRowData[];
  pdfId: number | null;
}

@Component({
  selector: 'app-shortlist',
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
    DialogModule,
    InputTextModule,
    ProgressSpinnerModule,
    ProgressBarModule,
    TooltipModule,
    NavbarComponent
  ],
  templateUrl: './shortlist.component.html',
  styleUrls: ['./shortlist.component.scss']
})
export class ShortlistComponent implements OnInit, OnDestroy {
  // Dependency Injection
  private readonly messageService = inject(MessageService);
  private readonly sessionTimerService = inject(SessionTimerService);
  private readonly authService = inject(AuthService);
  private readonly resumeService = inject(ResumeService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  // Destroy subject for cleanup
  private readonly destroy$ = new Subject<void>();
  private uploadSubscription: Subscription | null = null;
  private progressSimulationInterval: any = null;

  // State management with BehaviorSubjects for better control
  private readonly uploadState$ = new BehaviorSubject<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    canCancel: false,
    progressText: ''
  });

  private readonly componentState$ = new BehaviorSubject<ComponentState>({
    isLoading: false,
    isSubmitting: false,
    hasData: false,
    hasRankings: false,
    jobDescriptionContent: 'Upload a job description file and select a template to see the extracted content here.',
    filteredApiData: [],
    tableData: [],
    pdfId: null
  });

  private readonly filterState$ = new BehaviorSubject<FilterState>({
    minYearsExperience: 0,
    requiredDegree: 'Any',
    genderFilter: 'Any',
    nationality: 'Any',
    maxYearsExperience: null,
    maxQualification: 'Any'
  });

  private readonly weightState$ = new BehaviorSubject<WeightState>({
    experience: DEFAULT_WEIGHTS.experience,
    qualifications: DEFAULT_WEIGHTS.qualifications,
    skills: DEFAULT_WEIGHTS.skills,
    validationError: ''
  });

  private readonly formState$ = new BehaviorSubject<FormState>({
    selectedJobTemplate: 'UNV Template',
    searchQuery: '',
    searchOperator: 'and',
    selectedFile: null,
    fileValidationError: ''
  });

  private readonly dialogState$ = new BehaviorSubject<DialogState>({
    employment: {
      visible: false,
      candidateName: '',
      history: ''
    },
    jobDescription: {
      visible: false
    }
  });

  // Constants
  private readonly defaultJobDescriptionText = 'Upload a job description file and select a template to see the extracted content here.';
  readonly jobDescriptionTemplates: readonly FilterOption[] = Object.freeze([
    { label: 'UNV Template', value: 'UNV Template' },
    { label: 'SC Template', value: 'SC Template' },
    { label: 'SC Manager Template', value: 'SC Manager Template' },
    { label: 'IC Consultant Template', value: 'IC Consultant Template' }
  ]);

  // Public getters for template access
  get uploadState(): UploadState { return this.uploadState$.value; }
  get componentState(): ComponentState { return this.componentState$.value; }
  get filterState(): FilterState { return this.filterState$.value; }
  get weightState(): WeightState { return this.weightState$.value; }
  get formState(): FormState { return this.formState$.value; }
  get dialogState(): DialogState { return this.dialogState$.value; }

  // Computed properties
  get hasJobDescriptionContent(): boolean {
    return this.componentState.jobDescriptionContent !== this.defaultJobDescriptionText;
  }

  get isUploadInProgress(): boolean { return this.uploadState.isUploading; }
  get canCancel(): boolean { return this.uploadState.canCancel; }
  get uploadProgressText(): string { return this.uploadState.progressText; }

  // Template access properties
  get isSubmitting(): boolean { return this.componentState.isSubmitting; }
  get tableData(): TableRowData[] { return this.componentState.tableData; }
  get filteredApiData(): ApiResumeData[] { return this.componentState.filteredApiData; }
  get jobDescriptionContent(): string { return this.componentState.jobDescriptionContent; }

  get selectedJobTemplate(): string { return this.formState.selectedJobTemplate; }
  set selectedJobTemplate(value: string) { 
    this.updateFormState({ selectedJobTemplate: value });
    this.saveShortlistState();
  }

  get searchQuery(): string { return this.formState.searchQuery; }
  set searchQuery(value: string) { 
    this.updateFormState({ searchQuery: value });
    this.saveShortlistState();
  }

  get searchOperator(): string { return this.formState.searchOperator; }
  set searchOperator(value: string) { 
    this.updateFormState({ searchOperator: value });
    this.saveShortlistState();
  }

  get selectedFile(): File | null { return this.formState.selectedFile; }
  get fileValidationError(): string { return this.formState.fileValidationError; }

  get weightExperience(): number { return this.weightState.experience; }
  get weightQualifications(): number { return this.weightState.qualifications; }
  get weightSkills(): number { return this.weightState.skills; }
  get weightValidationError(): string { return this.weightState.validationError; }

  get selectedMinYearsExperience(): number { return this.filterState.minYearsExperience; }
  get selectedRequiredDegree(): string { return this.filterState.requiredDegree; }
  get selectedGenderFilter(): string { return this.filterState.genderFilter; }
  get selectedNationality(): string { return this.filterState.nationality; }
  get selectedMaxYearsExperience(): number | null { return this.filterState.maxYearsExperience; }
  get selectedMaxQualification(): string { return this.filterState.maxQualification; }

  get displayEmploymentDialog(): boolean { return this.dialogState.employment.visible; }
  set displayEmploymentDialog(value: boolean) { 
    this.updateDialogState({ 
      employment: { ...this.dialogState.employment, visible: value } 
    }); 
  }

  get displayJobDescriptionDialog(): boolean { return this.dialogState.jobDescription.visible; }
  set displayJobDescriptionDialog(value: boolean) { 
    this.updateDialogState({ 
      jobDescription: { visible: value } 
    }); 
  }

  get selectedEmploymentHistory(): string { return this.dialogState.employment.history; }
  get selectedCandidateName(): string { return this.dialogState.employment.candidateName; }

  get uploadProgress(): number { return this.uploadState.uploadProgress; }

  // Check if the component has restored state
  get hasRestoredState(): boolean {
    return this.resumeService.hasShortlistState() && 
           (this.hasJobDescriptionContent || this.componentState.hasRankings);
  }

  // Check if current file is restored from previous session
  isRestoredFile(): boolean {
    return this.hasRestoredState && this.formState.selectedFile !== null;
  }

  // Check if we have valid ranking data
  get hasValidRankingData(): boolean {
    return this.componentState.hasRankings && 
           this.componentState.tableData.length > 0 &&
           this.componentState.tableData.some(row => row.rank !== undefined && row.finalScore !== undefined);
  }

  // Check if the longlist data has changed compared to saved shortlist data
  private shouldUpdateTableWithNewData(): boolean {
    try {
      const currentFilteredData = this.componentState.filteredApiData;
      const currentTableData = this.componentState.tableData;
      
      // If no current table data, we should update
      if (!currentTableData || currentTableData.length === 0) {
        return true;
      }
      
      // If the number of records is different, data has changed
      if (currentFilteredData.length !== currentTableData.length) {
        console.log('Data length changed:', {
          filtered: currentFilteredData.length,
          table: currentTableData.length
        });
        return true;
      }
      
      // Check if the CV IDs match (more reliable than comparing full objects)
      const currentCvIds = new Set(currentFilteredData.map(cv => cv["CV ID"]));
      const tableCvIds = new Set(currentTableData.map(row => row.cvId));
      
      // Compare the sets of CV IDs
      if (currentCvIds.size !== tableCvIds.size) {
        console.log('Different number of unique CV IDs');
        return true;
      }
      
      // Check if all CV IDs from current data exist in table data
      for (const cvId of currentCvIds) {
        if (!tableCvIds.has(cvId)) {
          console.log('CV ID mismatch found:', cvId);
          return true;
        }
      }
      
      // Additional check: compare filter states if available
      const savedState = this.resumeService.getCurrentShortlistState();
      const currentLonglistFilter = this.resumeService.getCurrentLonglistFilterState();
      
      if (savedState?.lastLonglistFilter && currentLonglistFilter) {
        const savedFilter = savedState.lastLonglistFilter;
        const filtersChanged = (
          savedFilter.nationality !== currentLonglistFilter.nationality ||
          savedFilter.minExperience !== currentLonglistFilter.minExperience ||
          savedFilter.maxExperience !== currentLonglistFilter.maxExperience ||
          savedFilter.gender !== currentLonglistFilter.gender ||
          savedFilter.qualification !== currentLonglistFilter.qualification ||
          savedFilter.maxQualification !== currentLonglistFilter.maxQualification
        );
        
        if (filtersChanged) {
          console.log('Longlist filters have changed:', {
            saved: savedFilter,
            current: currentLonglistFilter
          });
          return true;
        }
      }
      
      console.log('Longlist data appears unchanged - same CV IDs, count, and filters');
      return false;
      
    } catch (error) {
      console.error('Error checking if table should update:', error);
      // If there's an error, safer to update
      return true;
    }
  }

  constructor() {
    console.log('ShortlistComponent constructor called');
    this.setupStateSubscriptions();
  }

  ngOnInit(): void {
    console.log('ShortlistComponent ngOnInit called');
    this.restoreShortlistState();
    this.loadDataFromLonglist();
    this.validateWeights();
  }

  ngOnDestroy(): void {
    this.saveShortlistState(); // Save state before destroying
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelUpload();
    this.stopProgressSimulation();
  }

  // State management methods
  private setupStateSubscriptions(): void {
    // Subscribe to upload state changes
    this.uploadState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });
  }

  private updateUploadState(partial: Partial<UploadState>): void {
    this.uploadState$.next({ ...this.uploadState$.value, ...partial });
  }

  private updateComponentState(partial: Partial<ComponentState>): void {
    this.componentState$.next({ ...this.componentState$.value, ...partial });
  }

  private updateFilterState(partial: Partial<FilterState>): void {
    this.filterState$.next({ ...this.filterState$.value, ...partial });
  }

  private updateWeightState(partial: Partial<WeightState>): void {
    this.weightState$.next({ ...this.weightState$.value, ...partial });
  }

  private updateFormState(partial: Partial<FormState>): void {
    this.formState$.next({ ...this.formState$.value, ...partial });
  }

  private updateDialogState(partial: Partial<DialogState>): void {
    this.dialogState$.next({ ...this.dialogState$.value, ...partial });
  }

  // === STATE PERSISTENCE METHODS ===

  private saveShortlistState(): void {
    try {
      const state = {
        componentState: this.componentState$.value,
        filterState: this.filterState$.value,
        weightState: this.weightState$.value,
        formState: {
          ...this.formState$.value,
          selectedFile: this.formState$.value.selectedFile ? {
            name: this.formState$.value.selectedFile.name,
            size: this.formState$.value.selectedFile.size,
            type: this.formState$.value.selectedFile.type
          } : null
        },
        dialogState: this.dialogState$.value,
        uploadState: this.uploadState$.value,
        lastLonglistFilter: this.resumeService.getCurrentLonglistFilterState(), // Save current longlist filter for comparison
        timestamp: Date.now()
      };

      this.resumeService.setShortlistState(state);
      console.log('=== SHORTLIST STATE SAVED ===');
      console.log('Component State:', {
        hasRankings: state.componentState?.hasRankings,
        tableDataLength: state.componentState?.tableData?.length || 0,
        firstRowSample: state.componentState?.tableData?.[0],
        jobDescriptionNotDefault: state.componentState?.jobDescriptionContent !== this.defaultJobDescriptionText
      });
      console.log('============================');
    } catch (error) {
      console.error('Error saving shortlist state:', error);
    }
  }

  private restoreShortlistState(): void {
    try {
      const savedState = this.resumeService.getCurrentShortlistState();
      
      if (!savedState) {
        console.log('No saved shortlist state found');
        return;
      }

      console.log('=== RESTORING SHORTLIST STATE ===');
      console.log('Restored state:', savedState);
      console.log('=================================');

      // Restore component state (but preserve loading state)
      if (savedState.componentState) {
        console.log('Restoring component state:', {
          hasRankings: savedState.componentState.hasRankings,
          tableDataLength: savedState.componentState.tableData?.length || 0,
          jobDescriptionContent: savedState.componentState.jobDescriptionContent !== this.defaultJobDescriptionText
        });
        
        this.componentState$.next({
          ...savedState.componentState,
          isLoading: false,
          isSubmitting: false
        });
      }

      // Restore filter state
      if (savedState.filterState) {
        this.filterState$.next(savedState.filterState);
      }

      // Restore weight state
      if (savedState.weightState) {
        this.weightState$.next(savedState.weightState);
      }

      // Restore form state with file reconstruction
      if (savedState.formState) {
        const formState = { ...savedState.formState };
        
        // Reconstruct file object if it existed
        if (savedState.formState.selectedFile) {
          const fileInfo = savedState.formState.selectedFile;
          const mockFile = new File([], fileInfo.name, { type: fileInfo.type });
          Object.defineProperty(mockFile, 'size', {
            value: fileInfo.size,
            writable: false
          });
          formState.selectedFile = mockFile;
        }
        
        this.formState$.next(formState);
      }

      // Restore dialog state (but keep dialogs closed)
      if (savedState.dialogState) {
        this.dialogState$.next({
          employment: {
            ...savedState.dialogState.employment,
            visible: false
          },
          jobDescription: {
            visible: false
          }
        });
      }

      // Don't restore upload state - always start fresh for uploads
      this.uploadState$.next({
        isUploading: false,
        uploadProgress: 0,
        canCancel: false,
        progressText: ''
      });

    } catch (error) {
      console.error('Error restoring shortlist state:', error);
    }
  }

  // Load data from longlist component
  private loadDataFromLonglist(): void {
    this.updateComponentState({ isLoading: true });

    try {
    // Get filtered data from the resume service using new API structure
      const filteredApiData = this.resumeService.getCurrentFilteredApiData();
      const pdfId = this.resumeService.getCurrentPdfId();

    console.log('=== LOADING DATA IN SHORTLIST ===');
      console.log('Filtered API data from service:', filteredApiData);
      console.log('PDF ID:', pdfId);
      console.log('Data length:', filteredApiData.length);
    console.log('===============================');

      if (filteredApiData.length === 0 || !pdfId) {
      console.warn('No filtered data found, checking for original data...');
      
      // Fallback to original data if no filtered data
        const originalData = this.resumeService.getCurrentOriginalApiData();
        
        if (originalData.length === 0) {
          this.updateComponentState({ 
            isLoading: false, 
            hasData: false,
            filteredApiData: [],
            pdfId: null
          });
        this.showWarningMessage(
          'No Data Available', 
          'Please go back to Long Listing and upload/filter CVs first.'
        );
        return;
      }

        this.updateComponentState({ 
          filteredApiData: originalData,
          pdfId: pdfId,
          hasData: true
        });
      } else {
        this.updateComponentState({ 
          filteredApiData,
          pdfId,
          hasData: true
        });
    }

    // Get filter state to populate the "Selected" fields
    const filterState = this.resumeService.getCurrentLonglistFilterState();
    console.log('Filter state from service:', filterState);
    
    if (filterState) {
        this.updateFilterState({
          minYearsExperience: parseInt(filterState.minExperience) || 0,
          requiredDegree: filterState.qualification || 'Any',
          genderFilter: filterState.gender || 'Any',
          nationality: filterState.nationality || 'Any',
          maxYearsExperience: filterState.maxExperience ? parseInt(filterState.maxExperience) : null,
          maxQualification: filterState.maxQualification || 'Any'
        });
    }

        // Check if the longlist data has changed compared to what we have saved
    const shouldUpdateTable = this.shouldUpdateTableWithNewData();
    
    if (!this.hasValidRankingData || shouldUpdateTable) {
      if (shouldUpdateTable) {
        console.log('Longlist data has changed, updating table with new filtered data');
        // Clear any existing rankings when data changes
        this.updateComponentState({ hasRankings: false });
        this.resumeService.clearShortlistState();
      } else {
        console.log('No valid ranking data found, initializing fresh table data');
      }
      this.initializeTableData();
    } else {
      console.log('Valid ranking data found and longlist data unchanged, keeping restored table data');
      console.log('Table data sample:', this.componentState.tableData[0]);
    }

    this.updateComponentState({ isLoading: false });
    
    let message: string;
    
    if (shouldUpdateTable && this.hasValidRankingData) {
      message = `Updated with ${this.componentState.filteredApiData.length} newly filtered CVs from Long Listing (previous rankings cleared)`;
    } else if (this.hasValidRankingData) {
      message = `Restored ${this.componentState.tableData.length} ranked candidates from previous session`;
    } else {
      message = `Loaded ${this.componentState.filteredApiData.length} filtered CVs from Long Listing`;
    }
      
    this.showInfoMessage('Data Loaded', message);

    } catch (error) {
      console.error('Error loading data from longlist:', error);
      this.updateComponentState({ 
        isLoading: false, 
        hasData: false 
      });
      this.showErrorMessage('Loading Error', 'Failed to load data from Long Listing');
    }
  }

  // Initialize table data without rankings
  private initializeTableData(): void {
    const tableData = this.componentState.filteredApiData.map((cv) => ({
      cvId: cv["CV ID"],
      name: cv["Name"],
      highestDegree: cv["Highest Degree"],
      yoe: cv["YOE"],
      gender: cv["Gender"],
      nationality: this.formatNationalityDisplay(cv["Nationality"]),
      employmentHistory: cv["Employment History"]
    }));

    this.updateComponentState({ 
      tableData,
      hasRankings: false
    });
  }

  // Helper method to format nationality for display
  private formatNationalityDisplay(nationality: string): string {
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

  // Helper method to format YOE for display
  formatYOE(yoe: number | null | undefined): string {
    if (yoe === null || yoe === undefined) {
      return 'N/A';
    }
    return yoe.toString();
  }

  // Show employment history dialog
  showEmploymentHistory(rowData: TableRowData): void {
    this.updateDialogState({
      employment: {
        visible: true,
        candidateName: `${rowData.cvId} - ${rowData.name}`,
        history: rowData.employmentHistory || 'No employment history available'
      }
    });
  }

  // Show job description dialog
  showJobDescriptionDialog(): void {
    this.updateDialogState({
      jobDescription: { visible: true }
    });
  }

  // Weight adjustment methods
  adjustWeight(field: string, increment: boolean): void {
    const step = 0.05; // Smaller increments for finer control
    const currentWeights = this.weightState;
    const newWeights = { ...currentWeights };
    
    if (increment) {
      switch (field) {
        case 'experience':
          newWeights.experience = Math.min(1, currentWeights.experience + step);
          break;
        case 'qualifications':
          newWeights.qualifications = Math.min(1, currentWeights.qualifications + step);
          break;
        case 'skills':
          newWeights.skills = Math.min(1, currentWeights.skills + step);
          break;
      }
    } else {
      switch (field) {
        case 'experience':
          newWeights.experience = Math.max(0, currentWeights.experience - step);
          break;
        case 'qualifications':
          newWeights.qualifications = Math.max(0, currentWeights.qualifications - step);
          break;
        case 'skills':
          newWeights.skills = Math.max(0, currentWeights.skills - step);
          break;
      }
    }
    
    this.updateWeightState(newWeights);
    this.validateWeights();
    // Save state when weights are adjusted
    this.saveShortlistState();
  }

  validateWeights(): void {
    const weights = this.weightState;
    const total = weights.experience + weights.qualifications + weights.skills;
    const tolerance = 0.01; // Allow small floating point differences
    
    const validationError = Math.abs(total - 1.0) > tolerance 
      ? `Weights must add up to 1.0 (currently: ${total.toFixed(2)})`
      : '';

    this.updateWeightState({ validationError });
  }

  submitRanking(): void {
    if (this.weightState.validationError) {
      this.showErrorMessage('Validation Error', this.weightState.validationError);
      return;
    }

    if (!this.componentState.pdfId) {
      this.showErrorMessage('Error', 'No PDF ID available. Please upload CVs first.');
      return;
    }

    if (!this.formState.selectedFile) {
      this.showErrorMessage('Error', 'Please upload a job description file.');
      return;
    }

    // Re-validate file before submission
    if (!this.validateFile(this.formState.selectedFile)) {
      return;
    }

    this.updateComponentState({ isSubmitting: true });
    this.updateUploadState({ 
      isUploading: true, 
      uploadProgress: 10, 
      canCancel: true, 
      progressText: 'Validating job description... (Click X to cancel)' 
    });

    // Detailed logging for debugging
    console.log('=== SUBMITTING SHORTLIST REQUEST ===');
    console.log('PDF ID:', this.componentState.pdfId);
    console.log('Job Template:', this.formState.selectedJobTemplate);
    console.log('Search Query:', this.formState.searchQuery);
    console.log('Weights:', {
      experience: this.weightState.experience,
      qualifications: this.weightState.qualifications,
      skills: this.weightState.skills
    });
    console.log('File:', this.formState.selectedFile?.name);
    console.log('====================================');

    // Start animated progress simulation
    this.startProgressSimulation();

    this.uploadSubscription = this.resumeService.submitShortlistWithFile(
      this.componentState.pdfId,
      this.formState.selectedFile,
      this.formState.selectedJobTemplate,
      this.formState.searchQuery,
      this.formState.searchOperator,
      this.weightState.experience,
      this.weightState.qualifications,
      this.weightState.skills
    )
    .pipe(
      finalize(() => {
        this.updateComponentState({ isSubmitting: false });
        this.stopProgressSimulation();
        // Complete progress bar on both success and error
        this.updateUploadState({ 
          isUploading: true, 
          uploadProgress: 100, 
          canCancel: false, 
          progressText: 'Processing complete!' 
        });
        setTimeout(() => {
          this.updateUploadState({ 
            isUploading: false, 
            uploadProgress: 0, 
            canCancel: false, 
            progressText: '' 
          });
        }, 1500);
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (response) => {
        this.updateUploadState({ 
          uploadProgress: 95, 
          progressText: 'Finalizing rankings...' 
        });
        this.handleRankingSuccess(response);
      },
      error: (error) => {
        this.updateUploadState({ 
          uploadProgress: 100, 
          progressText: 'Processing failed' 
        });
        this.handleRankingError(error);
      }
    });
  }

  private handleRankingSuccess(response: ShortlistResponse): void {
    console.log('=== SHORTLIST API RESPONSE ===');
    console.log('Response:', response);
    console.log('==============================');

    // Update job description content
    if (response.relevant_section_text) {
      this.updateComponentState({ 
        jobDescriptionContent: response.relevant_section_text 
      });
    }

    // Update table data with rankings
    const shortlistedData = (response as any).shortlisted;
    if (shortlistedData && shortlistedData.length > 0) {
      const tableData = shortlistedData.map((candidate: any) => ({
        cvId: candidate.CV,
        name: candidate["Applicant Name"],
        highestDegree: candidate["Highest Degree"],
        yoe: candidate.YOE,
        gender: candidate.Gender,
        nationality: this.formatNationalityDisplay(candidate.Nationality),
        rank: candidate.Rank,
        finalScore: candidate["Final Score"],
        employmentHistory: candidate["Employment History"]
      }));

      this.updateComponentState({ 
        tableData,
        hasRankings: true
      });

      // Save state after successful ranking
      this.saveShortlistState();

      this.showSuccessMessage(
        'Ranking Complete',
        `Successfully ranked ${shortlistedData.length} candidates`
      );
    } else {
      this.showWarningMessage(
        'No Results',
        'No candidates were shortlisted based on the criteria'
      );
    }
  }

  private handleRankingError(error: any): void {
    console.error('=== SHORTLIST API ERROR ===');
    console.error('Error:', error);
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });
    console.error('===========================');

    let errorMessage = 'An error occurred during ranking';
    if (error?.status === 500) {
      errorMessage = 'Please check your file or template';
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.showErrorMessage('Ranking Failed', errorMessage);
  }

  resetRanking(): void {
    // Reset form state
    this.updateFormState({
      selectedJobTemplate: 'UNV Template',
      searchQuery: '',
      searchOperator: 'and',
      selectedFile: null,
      fileValidationError: ''
    });

    // Reset weight state
    this.updateWeightState({
      experience: DEFAULT_WEIGHTS.experience,
      qualifications: DEFAULT_WEIGHTS.qualifications,
      skills: DEFAULT_WEIGHTS.skills,
      validationError: ''
    });

    // Reset component state
    this.updateComponentState({
      jobDescriptionContent: this.defaultJobDescriptionText,
      hasRankings: false
    });

    // Reset table data without rankings
    this.initializeTableData();
    this.validateWeights();

    // Clear saved state when resetting completely
    this.resumeService.clearShortlistState();

    this.showInfoMessage('Reset Complete', 'Ranking has been reset to initial state');
  }

  // Progress simulation methods
  private startProgressSimulation(): void {
    let progress = 10;
    let stage = 0;
    const stages = [
      { max: 25, text: 'Uploading job description...' },
      { max: 45, text: 'Extracting job requirements...' },
      { max: 65, text: 'Analyzing candidate profiles...' },
      { max: 85, text: 'Calculating rankings...' },
      { max: 95, text: 'Processing final results...' }
    ];
    
    this.progressSimulationInterval = setInterval(() => {
      // Move to next stage if current stage is complete
      if (progress >= stages[stage].max && stage < stages.length - 1) {
        stage++;
      }
      
      // Add small random increment to show activity
      const increment = Math.random() * 2 + 0.5;
      progress = Math.min(progress + increment, 95); // Cap at 95% until real response
      
      // Update upload state with current stage text
      this.updateUploadState({ 
        uploadProgress: Math.round(progress),
        progressText: stages[stage].text + ' (Click X to cancel)'
      });
      
      // Stop if we've reached the final stage and 95%
      if (progress >= 95) {
        this.stopProgressSimulation();
      }
    }, 800); // Slower updates for more realistic feel
    
    // Auto-clear after 2 minutes to prevent infinite running
    setTimeout(() => {
      this.stopProgressSimulation();
    }, 120000);
  }

  private stopProgressSimulation(): void {
    if (this.progressSimulationInterval) {
      clearInterval(this.progressSimulationInterval);
      this.progressSimulationInterval = null;
    }
  }

  // Cancel upload functionality
  cancelUpload(): void {
    if (this.uploadSubscription && !this.uploadSubscription.closed) {
      console.log('Cancelling upload...');
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
      this.stopProgressSimulation();
      this.updateUploadState({ 
        isUploading: false, 
        uploadProgress: 0, 
        canCancel: false, 
        progressText: '' 
      });
      this.updateComponentState({ isSubmitting: false });
      this.showInfoMessage('Upload Cancelled', 'Job description upload has been cancelled');
    }
  }

  // File handling methods with enhanced validation
  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      if (this.validateFile(file)) {
        this.updateFormState({ 
          selectedFile: file,
          fileValidationError: ''
        });
        // Save state when file is selected
        this.saveShortlistState();
        this.showInfoMessage('File Selected', `Selected: ${file.name}`);
      }
      // Clear the file input to allow selecting the same file again
      event.target.value = '';
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.validateFile(file)) {
        this.updateFormState({ 
          selectedFile: file,
          fileValidationError: ''
        });
        // Save state when file is dropped
        this.saveShortlistState();
        this.showInfoMessage('File Dropped', `Selected: ${file.name}`);
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  removeSelectedFile(): void {
    this.updateFormState({ 
      selectedFile: null,
      fileValidationError: ''
    });
    
    // Clear any existing ranking results when file is removed
    this.initializeTableData();
    this.updateComponentState({ 
      jobDescriptionContent: this.defaultJobDescriptionText,
      hasRankings: false
    });
    // Save state when file is removed
    this.saveShortlistState();
    this.showInfoMessage('File Removed', 'Job description file has been removed');
  }

  private validateFile(file: File): boolean {
    // Check file size
    if (file.size === 0) {
      const error = 'Empty file detected. Please select a valid file.';
      this.updateFormState({ fileValidationError: error });
      this.showErrorMessage('Invalid File', error);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      const error = 'File size must be less than 200MB';
      this.updateFormState({ fileValidationError: error });
      this.showErrorMessage('File Size Error', error);
      return false;
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      const error = 'Only PDF and TXT files are allowed';
      this.updateFormState({ fileValidationError: error });
      this.showErrorMessage('File Type Error', error);
      return false;
    }

    // Check MIME type (if available)
    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
      console.warn('MIME type check failed, but proceeding based on extension:', file.type);
    }

    // Clear any previous validation errors
    this.updateFormState({ fileValidationError: '' });
    return true;
  }

  // Message helper methods
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
