import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

// Services
import { ResumeService, ResumeData, ShortlistCandidate, ShortlistResponse } from '../services/resume.service';
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
import { AccordionModule } from 'primeng/accordion';
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

interface EmploymentHistory {
  id: string;
  name: string;
  details: string;
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
    AccordionModule,
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

  // Destroy subject for cleanup
  private readonly destroy$ = new Subject<void>();

  // Data from longlist
  filteredResumeData: ResumeData[] = [];
  pdfId: number | null = null;

  // Job Description Template Options
  readonly jobDescriptionTemplates: readonly FilterOption[] = Object.freeze([
    { label: 'UNV Template', value: 'unv' },
    { label: 'SC Template', value: 'sc' },
    { label: 'SC Manager Template', value: 'sc_manager' },
    { label: 'IC Consultant Template', value: 'ic_consultant' }
  ]);

  // Search Operator Options
  readonly searchOperatorOptions: readonly FilterOption[] = Object.freeze([
    { label: 'AND', value: 'and' },
    { label: 'OR', value: 'or' }
  ]);

  // Form Values
  selectedJobTemplate: string = 'unv';
  searchQuery: string = '';
  selectedSearchOperator: string = 'and';
  
  // Weight values (must add up to 1.0)
  weightExperience: number = 0.30;
  weightQualifications: number = 0.40;
  weightSkills: number = 0.30;
  
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

  // Employment History
  employmentHistory: EmploymentHistory[] = [];

  // Ranking Results - Initially show filtered data with "--" rankings
  rankingResults: ShortlistCandidate[] = [];

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
    // Get filtered data from the resume service
    this.filteredResumeData = this.resumeService.getCurrentFilteredResumeData();
    this.pdfId = this.resumeService.getCurrentPdfId();

    if (this.filteredResumeData.length === 0 || !this.pdfId) {
      console.warn('No filtered data found, checking for any resume data...');
      
      // Fallback to all resume data if no filtered data
      this.filteredResumeData = this.resumeService.getCurrentResumeData();
      
      if (this.filteredResumeData.length === 0) {
        this.showWarningMessage(
          'No Data Available', 
          'Please go back to Long Listing and upload/filter CVs first.'
        );
        return;
      }
    }

    // Get filter state to populate the "Selected" fields
    const filterState = this.resumeService.getCurrentFilterState();
    if (filterState) {
      this.selectedMinYearsExperience = parseInt(filterState.minExperience) || 0;
      this.selectedRequiredDegree = filterState.qualification || 'Any';
      this.selectedGenderFilter = filterState.gender || 'Any';
    }

    // Initialize ranking results with "--" scores
    this.initializeRankingResults();

    this.showInfoMessage(
      'Data Loaded', 
      `Loaded ${this.filteredResumeData.length} filtered CVs from Long Listing`
    );
  }

  // Initialize ranking results with placeholder rankings
  private initializeRankingResults(): void {
    this.rankingResults = this.filteredResumeData.map((cv, index) => ({
      rank: undefined,
      cvId: cv.id || `CV${index + 1}`,
      name: cv.name,
      highestDegree: cv.qualification,
      yoe: cv.experience,
      finalScore: '--', // Placeholder until ranking is performed
      gender: cv.gender || 'Unknown',
      nationality: cv.nationality
    }));
  }

  // Weight adjustment methods
  adjustWeight(field: string, increment: boolean): void {
    const adjustment = increment ? 0.10 : -0.10;
    
    switch (field) {
      case 'experience':
        this.weightExperience = Math.max(0, Math.min(1, this.weightExperience + adjustment));
        break;
      case 'qualifications':
        this.weightQualifications = Math.max(0, Math.min(1, this.weightQualifications + adjustment));
        break;
      case 'skills':
        this.weightSkills = Math.max(0, Math.min(1, this.weightSkills + adjustment));
        break;
    }
    
    // Round to 2 decimal places to avoid floating point issues
    this.weightExperience = Math.round(this.weightExperience * 100) / 100;
    this.weightQualifications = Math.round(this.weightQualifications * 100) / 100;
    this.weightSkills = Math.round(this.weightSkills * 100) / 100;
    
    this.validateWeights();
  }

  // Validate that weights add up to 1.0
  validateWeights(): void {
    const total = this.weightExperience + this.weightQualifications + this.weightSkills;
    const roundedTotal = Math.round(total * 100) / 100;
    
    if (roundedTotal !== 1.0) {
      this.weightValidationError = `Total weight must equal 1.0 (current: ${roundedTotal.toFixed(2)})`;
    } else {
      this.weightValidationError = '';
    }
  }

  // Submit ranking
  submitRanking(): void {
    if (this.weightValidationError) {
      this.showErrorMessage('Validation Error', this.weightValidationError);
      return;
    }

    if (!this.pdfId) {
      this.showErrorMessage('Error', 'No PDF ID found. Please upload CVs in Long Listing first.');
      return;
    }

    this.isSubmitting = true;

    // Choose API method based on whether file is uploaded
    const apiCall = this.selectedFile ? 
      this.resumeService.submitShortlistWithFile(
        this.pdfId,
        this.selectedFile,
        this.selectedJobTemplate,
        this.searchQuery,
        this.selectedSearchOperator,
        this.weightExperience,
        this.weightQualifications,
        this.weightSkills
      ) :
      this.resumeService.submitShortlistWithTemplate(
        this.pdfId,
        this.selectedJobTemplate,
        this.searchQuery,
        this.selectedSearchOperator,
        this.weightExperience,
        this.weightQualifications,
        this.weightSkills
      );

    apiCall
      .pipe(
        finalize(() => this.isSubmitting = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => this.handleRankingSuccess(response),
        error: (error) => this.handleRankingError(error)
      });
  }

    // Handle successful ranking response
  private handleRankingSuccess(response: any): void {
    console.log('=== FULL API RESPONSE ===');
    console.log('Response object:', response);
    console.log('Response keys:', Object.keys(response));
    console.log('=========================');

    try {
      // Update ranking results from API response
      if (response.shortlisted && response.shortlisted.length > 0) {
        console.log('Processing response.shortlisted:', response.shortlisted);
        this.rankingResults = response.shortlisted.map((candidate: any) => {
          console.log('Processing candidate:', candidate);
          
          // Clean nationality field (remove brackets and quotes)
          let nationality = candidate.Nationality || candidate.nationality || 'Unknown';
          if (typeof nationality === 'string' && nationality.includes('[')) {
            nationality = nationality.replace(/[\[\]"']/g, '').trim();
          }

          return {
            rank: candidate.Rank,
            cvId: candidate.CV,
            name: candidate['Applicant Name'] || candidate.name,
            highestDegree: candidate['Highest Degree'] || candidate.qualification,
            yoe: candidate.YOE || candidate.experience,
            finalScore: candidate['Final Score'] ? candidate['Final Score'].toFixed(4) : '--',
            gender: candidate.Gender || 'Unknown',
            nationality: nationality
          };
        });
        console.log('Updated rankingResults:', this.rankingResults);
      } else {
        console.warn('No shortlisted data found in response');
      }

      // Update job description content from API response
      if (response.relevant_section_text) {
        this.jobDescriptionContent = response.relevant_section_text;
        console.log('Updated job description content');
      }

      // Create employment history from shortlisted candidates
      if (response.shortlisted && response.shortlisted.length > 0) {
        this.employmentHistory = response.shortlisted
          .filter((candidate: any) => candidate['Employment History'])
          .map((candidate: any) => ({
            id: candidate.CV,
            name: candidate['Applicant Name'] || candidate.name,
            details: candidate['Employment History']
          }));
        console.log('Updated employment history:', this.employmentHistory);
      }

      this.showSuccessMessage(
        'Ranking Complete',
        `Successfully ranked ${this.rankingResults.length} candidates`
      );
    } catch (error) {
      console.error('Error processing ranking response:', error);
      this.showErrorMessage('Processing Error', 'Failed to process ranking results');
    }
  }

  // Handle ranking error
  private handleRankingError(error: any): void {
    console.error('Ranking error:', error);
    
    let errorMessage = 'Failed to perform ranking. Please try again.';
    
    if (error.status === 422) {
      errorMessage = 'Invalid request parameters. Please check your inputs and try again.';
    } else if (error.status === 404) {
      errorMessage = 'PDF data not found. Please go back to Long Listing and upload CVs.';
    }
    
    this.showErrorMessage('Ranking Failed', errorMessage);
  }

  // Reset ranking
  resetRanking(): void {
    this.weightExperience = 0.30;
    this.weightQualifications = 0.40;
    this.weightSkills = 0.30;
    this.selectedJobTemplate = 'unv';
    this.selectedSearchOperator = 'and';
    this.searchQuery = '';
    this.selectedFile = null;
    this.validateWeights();
    
    // Reset ranking results to show "--" again
    this.initializeRankingResults();
    
    // Reset job description content
    this.jobDescriptionContent = 'Upload a job description file or select a template to see the extracted content here.';
    
    // Clear employment history
    this.employmentHistory = [];
    
    this.showInfoMessage('Reset Complete', 'All ranking parameters have been reset');
  }

  // File upload handling
  onFileSelect(event: any): void {
    const file = event.files?.[0];
    if (file && this.validateFile(file)) {
      this.selectedFile = file;
      this.showSuccessMessage('File Selected', `File "${file.name}" selected successfully`);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer?.files?.[0];
    if (file && this.validateFile(file)) {
      this.selectedFile = file;
      this.showSuccessMessage('File Uploaded', `File "${file.name}" uploaded successfully`);
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

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.showInfoMessage('File Removed', 'Selected file has been removed');
  }

  // File validation
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
