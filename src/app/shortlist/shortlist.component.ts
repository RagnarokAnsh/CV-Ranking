import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

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
import { MessageService } from 'primeng/api';

// Navbar Component Import
import { NavbarComponent } from '../shared/navbar/navbar.component';

// Constants
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_FILE_TYPE = 'application/pdf';

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

  // Data from longlist - using new API structure
  filteredApiData: ApiResumeData[] = [];
  pdfId: number | null = null;

  // Job Description Template Options (case sensitive as per API requirement)
  readonly jobDescriptionTemplates: readonly FilterOption[] = Object.freeze([
    { label: 'UNV Template', value: 'UNV Template' },
    { label: 'SC Template', value: 'SC Template' },
    { label: 'SC Manager Template', value: 'SC Manager Template' },
    { label: 'IC Consultant Template', value: 'IC Consultant Template' }
  ]);

  // Form Values
  selectedJobTemplate: string = 'UNV Template';
  searchQuery: string = '';
  
  // Weight values with API default values (0.3, 0.3, 0.4)
  weightExperience: number = 0.3;
  weightQualifications: number = 0.3;
  weightSkills: number = 0.4;
  
  // Validation
  weightValidationError: string = '';

  // File upload
  selectedFile: File | null = null;

  // Loading states
  isSubmitting: boolean = false;

  // Selected filters from longlist (populated from service)
  selectedMinYearsExperience: number = 0;
  selectedRequiredDegree: string = 'Any';
  selectedGenderFilter: string = 'Any';

  // Job Description Content
  jobDescriptionContent: string = 'Upload a job description file or select a template to see the extracted content here.';

  // Table data - Initially show filtered data without rankings
  tableData: TableRowData[] = [];

  // Employment History Dialog
  displayEmploymentDialog: boolean = false;
  selectedEmploymentHistory: string = '';
  selectedCandidateName: string = '';

  constructor() {
    console.log('ShortlistComponent constructor called');
  }

  ngOnInit(): void {
    console.log('ShortlistComponent ngOnInit called');
    this.loadDataFromLonglist();
    this.validateWeights();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load data from longlist component
  private loadDataFromLonglist(): void {
    // Get filtered data from the resume service using new API structure
    this.filteredApiData = this.resumeService.getCurrentFilteredApiData();
    this.pdfId = this.resumeService.getCurrentPdfId();

    console.log('=== LOADING DATA IN SHORTLIST ===');
    console.log('Filtered API data from service:', this.filteredApiData);
    console.log('PDF ID:', this.pdfId);
    console.log('Data length:', this.filteredApiData.length);
    console.log('===============================');

    if (this.filteredApiData.length === 0 || !this.pdfId) {
      console.warn('No filtered data found, checking for original data...');
      
      // Fallback to original data if no filtered data
      this.filteredApiData = this.resumeService.getCurrentOriginalApiData();
      
      if (this.filteredApiData.length === 0) {
        this.showWarningMessage(
          'No Data Available', 
          'Please go back to Long Listing and upload/filter CVs first.'
        );
        return;
      }
    }

    // Get filter state to populate the "Selected" fields
    const filterState = this.resumeService.getCurrentLonglistFilterState();
    console.log('Filter state from service:', filterState);
    
    if (filterState) {
      this.selectedMinYearsExperience = parseInt(filterState.minExperience) || 0;
      this.selectedRequiredDegree = filterState.qualification || 'Any';
      this.selectedGenderFilter = filterState.gender || 'Any';
    }

    // Initialize table data without rankings
    this.initializeTableData();

    this.showInfoMessage(
      'Data Loaded', 
      `Loaded ${this.filteredApiData.length} filtered CVs from Long Listing`
    );
  }

  // Initialize table data without rankings
  private initializeTableData(): void {
    this.tableData = this.filteredApiData.map((cv) => ({
      cvId: cv["CV ID"],
      name: cv["Name"],
      highestDegree: cv["Highest Degree"],
      yoe: cv["YOE"],
      gender: cv["Gender"],
      nationality: this.formatNationalityDisplay(cv["Nationality"]),
      employmentHistory: cv["Employment History"]
    }));
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

  // Show employment history dialog
  showEmploymentHistory(rowData: TableRowData): void {
    this.selectedCandidateName = `${rowData.cvId} - ${rowData.name}`;
    this.selectedEmploymentHistory = rowData.employmentHistory || 'No employment history available';
    this.displayEmploymentDialog = true;
  }

  // Weight adjustment methods
  adjustWeight(field: string, increment: boolean): void {
    const step = 0.05; // Smaller increments for finer control
    
    if (increment) {
      switch (field) {
        case 'experience':
          this.weightExperience = Math.min(1, this.weightExperience + step);
          break;
        case 'qualifications':
          this.weightQualifications = Math.min(1, this.weightQualifications + step);
          break;
        case 'skills':
          this.weightSkills = Math.min(1, this.weightSkills + step);
          break;
      }
    } else {
      switch (field) {
        case 'experience':
          this.weightExperience = Math.max(0, this.weightExperience - step);
          break;
        case 'qualifications':
          this.weightQualifications = Math.max(0, this.weightQualifications - step);
          break;
        case 'skills':
          this.weightSkills = Math.max(0, this.weightSkills - step);
          break;
      }
    }
    
    this.validateWeights();
  }

  validateWeights(): void {
    const total = this.weightExperience + this.weightQualifications + this.weightSkills;
    const tolerance = 0.01; // Allow small floating point differences
    
    if (Math.abs(total - 1.0) > tolerance) {
      this.weightValidationError = `Weights must add up to 1.0 (currently: ${total.toFixed(2)})`;
    } else {
      this.weightValidationError = '';
    }
  }

  submitRanking(): void {
    if (this.weightValidationError) {
      this.showErrorMessage('Validation Error', this.weightValidationError);
      return;
    }

    if (!this.pdfId) {
      this.showErrorMessage('Error', 'No PDF ID available. Please upload CVs first.');
      return;
    }

    if (!this.selectedFile) {
      this.showErrorMessage('Error', 'Please upload a job description file.');
      return;
    }

    this.isSubmitting = true;

    // Detailed logging for debugging
    console.log('=== SUBMITTING SHORTLIST REQUEST ===');
    console.log('PDF ID:', this.pdfId);
    console.log('Job Template:', this.selectedJobTemplate);
    console.log('Search Query:', this.searchQuery);
    console.log('Weights:', {
      experience: this.weightExperience,
      qualifications: this.weightQualifications,
      skills: this.weightSkills
    });
    console.log('File:', this.selectedFile?.name);
    console.log('====================================');

    this.resumeService.submitShortlistWithFile(
      this.pdfId,
      this.selectedFile,
      this.selectedJobTemplate,
      this.searchQuery,
      'and', // Default search operator
      this.weightExperience,
      this.weightQualifications,
      this.weightSkills
    )
    .pipe(
      finalize(() => this.isSubmitting = false),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (response) => this.handleRankingSuccess(response),
      error: (error) => this.handleRankingError(error)
    });
  }

  private handleRankingSuccess(response: ShortlistResponse): void {
    console.log('=== SHORTLIST API RESPONSE ===');
    console.log('Response:', response);
    console.log('==============================');

    // Update job description content
    if (response.relevant_section_text) {
      this.jobDescriptionContent = response.relevant_section_text;
    }

    // Update table data with rankings
    // Check if response has shortlisted data in the expected format
    const shortlistedData = (response as any).shortlisted;
    if (shortlistedData && shortlistedData.length > 0) {
      this.tableData = shortlistedData.map((candidate: any) => ({
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
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.showErrorMessage('Ranking Failed', errorMessage);
  }

  resetRanking(): void {
    // Reset to initial state without rankings
    this.initializeTableData();
    this.jobDescriptionContent = 'Upload a job description file or select a template to see the extracted content here.';
    this.selectedFile = null;
    this.searchQuery = '';
    this.selectedJobTemplate = 'UNV Template';
    
    // Reset weights to defaults
    this.weightExperience = 0.3;
    this.weightQualifications = 0.3;
    this.weightSkills = 0.4;
    this.validateWeights();

    this.showInfoMessage('Reset Complete', 'Ranking has been reset to initial state');
  }

  // File handling methods
  onFileSelect(event: any): void {
    const file = event.files[0];
    if (file && this.validateFile(file)) {
      this.selectedFile = file;
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0 && this.validateFile(files[0])) {
      this.selectedFile = files[0];
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  private validateFile(file: File): boolean {
    if (file.size > MAX_FILE_SIZE) {
      this.showErrorMessage('File Size Error', 'File size must be less than 200MB');
      return false;
    }

    if (file.type !== ALLOWED_FILE_TYPE) {
      this.showErrorMessage('File Type Error', 'Only PDF files are allowed');
      return false;
    }

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
