import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface ResumeData {
  id?: string;
  name: string;
  nationality: string;
  experience: number;
  age?: number; 
  qualification: string;
  gender?: string;
  languages?: string[];
  employmentHistory?: string;
  [key: string]: any; 
}


export interface ApiResumeData {
  "CV ID": string;
  "Name": string;
  "Highest Degree": string;
  "YOE": number;
  "Gender": string;
  "Nationality": string;
  "Employment History": string;
}

export interface UploadResumeResponse {
  message: string;
  pdf_id: number;
  rows: number;
  data: ApiResumeData[];
}

export interface SaveFilteredRequest {
  pdf_id: number;
  min_experience: number;
  min_degree: string;
  data: ApiResumeData[];
}

export interface SaveFilteredResponse {
  message?: string;
  success?: boolean;
  [key: string]: any;
}

// Shortlist/Ranking interfaces based on API swagger
export interface ShortlistRequest {
  pdf_id: number;
  jd_file?: File;
  jd_template: string;
  search_query: string;
  search_operator: string;
  weight_experience: number;
  weight_qualifications: number;
  weight_skills: number;
}

export interface ShortlistCandidate {
  rank?: number;
  cvId?: string;
  cv_id?: string;
  name: string;
  highestDegree?: string;
  highest_degree?: string;
  yoe?: number;
  years_of_experience?: number;
  finalScore?: number | string;
  final_score?: number | string;
  score?: number | string;
  gender?: string;
  nationality?: string;
  employmentHistory?: string;
  employment_history?: string;
  [key: string]: any;
}

export interface ShortlistResponse {
  message?: string;
  data?: ShortlistCandidate[];
  shortlisted?: ShortlistCandidate[];
  job_description_content?: string;
  relevant_section_text?: string;
  employment_history?: Array<{
    id: string;
    name: string;
    details: string;
  }>;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private apiUrl = 'http://3.6.143.181:8504/api/resume';
  
  // State management for persisting data across navigation
  private resumeDataSubject = new BehaviorSubject<ResumeData[]>([]);
  private filteredResumeDataSubject = new BehaviorSubject<ResumeData[]>([]);
  private pdfIdSubject = new BehaviorSubject<number | null>(null);
  private filterStateSubject = new BehaviorSubject<any>(null);
  
  // New state management for longlist with API data structure
  private originalApiDataSubject = new BehaviorSubject<ApiResumeData[]>([]);
  private filteredApiDataSubject = new BehaviorSubject<ApiResumeData[]>([]);
  private longlistFilterStateSubject = new BehaviorSubject<any>(null);
  private dynamicFilterOptionsSubject = new BehaviorSubject<any>({
    nationalities: [],
    qualifications: [],
    genders: []
  });
  private selectedFileInfoSubject = new BehaviorSubject<{ name: string; size: number } | null>(null);
  
  // Shortlist state management
  private shortlistStateSubject = new BehaviorSubject<any>(null);
  
  public resumeData$ = this.resumeDataSubject.asObservable();
  public filteredResumeData$ = this.filteredResumeDataSubject.asObservable();
  public pdfId$ = this.pdfIdSubject.asObservable();
  public filterState$ = this.filterStateSubject.asObservable();
  
  // New observables for longlist state
  public originalApiData$ = this.originalApiDataSubject.asObservable();
  public filteredApiData$ = this.filteredApiDataSubject.asObservable();
  public longlistFilterState$ = this.longlistFilterStateSubject.asObservable();
  public dynamicFilterOptions$ = this.dynamicFilterOptionsSubject.asObservable();
  public selectedFileInfo$ = this.selectedFileInfoSubject.asObservable();
  public shortlistState$ = this.shortlistStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { 
    // Listen for logout events and clear data
    this.authService.logout$.subscribe(isLogout => {
      if (isLogout) {
        this.clearData();
      }
    });
  }

  // Get current resume data
  getCurrentResumeData(): ResumeData[] {
    return this.resumeDataSubject.value;
  }

  // Get current filtered resume data
  getCurrentFilteredResumeData(): ResumeData[] {
    return this.filteredResumeDataSubject.value;
  }

  // Get current PDF ID
  getCurrentPdfId(): number | null {
    return this.pdfIdSubject.value;
  }

  // Get current filter state
  getCurrentFilterState(): any {
    return this.filterStateSubject.value;
  }

  // Set resume data (called after successful upload)
  setResumeData(data: ResumeData[], pdfId: number): void {
    this.resumeDataSubject.next(data);
    this.filteredResumeDataSubject.next([...data]); // Initially, filtered data = all data
    this.pdfIdSubject.next(pdfId);
    this.filterStateSubject.next(null); // Reset filter state
  }

  // Set filtered data and filter state (called after applying filters)
  setFilteredData(filteredData: ResumeData[], filterState: any): void {
    this.filteredResumeDataSubject.next(filteredData);
    this.filterStateSubject.next(filterState);
  }

  // Clear all data (optional - for logout or reset)
  clearData(): void {
    this.resumeDataSubject.next([]);
    this.filteredResumeDataSubject.next([]);
    this.pdfIdSubject.next(null);
    this.filterStateSubject.next(null);
    // Clear longlist data as well
    this.clearLonglistData();
  }

  // Check if data exists
  hasData(): boolean {
    return this.resumeDataSubject.value.length > 0 && this.pdfIdSubject.value !== null;
  }

  // Check if filtered data exists (different from original data)
  hasFilteredData(): boolean {
    const original = this.resumeDataSubject.value;
    const filtered = this.filteredResumeDataSubject.value;
    return filtered.length !== original.length || this.filterStateSubject.value !== null;
  }

  // === NEW LONGLIST STATE MANAGEMENT METHODS ===

  // Get current longlist API data
  getCurrentOriginalApiData(): ApiResumeData[] {
    return this.originalApiDataSubject.value;
  }

  getCurrentFilteredApiData(): ApiResumeData[] {
    return this.filteredApiDataSubject.value;
  }

  getCurrentLonglistFilterState(): any {
    return this.longlistFilterStateSubject.value;
  }

  getCurrentDynamicFilterOptions(): any {
    return this.dynamicFilterOptionsSubject.value;
  }

  // Get current selected file info
  getCurrentSelectedFileInfo(): { name: string; size: number } | null {
    return this.selectedFileInfoSubject.value;
  }

  // Get current shortlist state
  getCurrentShortlistState(): any {
    return this.shortlistStateSubject.value;
  }

  // Set longlist data after upload
  setLonglistData(originalData: ApiResumeData[], pdfId: number, dynamicOptions: any, fileInfo?: { name: string; size: number }): void {
    // Create deep copies to ensure new references
    const originalDataCopy = originalData.map(item => ({ ...item }));
    const filteredDataCopy = originalData.map(item => ({ ...item }));
    
    this.originalApiDataSubject.next(originalDataCopy);
    this.filteredApiDataSubject.next(filteredDataCopy);
    this.pdfIdSubject.next(pdfId);
    this.dynamicFilterOptionsSubject.next(dynamicOptions);
    this.longlistFilterStateSubject.next(null); // Reset filter state
    
    // Store file info if provided
    if (fileInfo) {
      this.selectedFileInfoSubject.next(fileInfo);
    }
  }

  // Set filtered longlist data and filter state
  setLonglistFilteredData(filteredData: ApiResumeData[], filterState: any): void {
    // Create deep copy to ensure new reference
    const filteredDataCopy = filteredData.map(item => ({ ...item }));
    this.filteredApiDataSubject.next(filteredDataCopy);
    this.longlistFilterStateSubject.next(filterState);
  }

  // Clear longlist data
  clearLonglistData(): void {
    this.originalApiDataSubject.next([]);
    this.filteredApiDataSubject.next([]);
    this.longlistFilterStateSubject.next(null);
    this.dynamicFilterOptionsSubject.next({
      nationalities: [],
      qualifications: [],
      genders: []
    });
    this.selectedFileInfoSubject.next(null); // Clear file info
    this.shortlistStateSubject.next(null); // Clear shortlist state
  }

  // Check if longlist data exists
  hasLonglistData(): boolean {
    return this.originalApiDataSubject.value.length > 0 && this.pdfIdSubject.value !== null;
  }

  // Check if longlist has applied filters
  hasLonglistFilters(): boolean {
    const filterState = this.longlistFilterStateSubject.value;
    return filterState !== null && (
      filterState.nationality || 
      filterState.minExperience || 
      filterState.maxExperience || 
      filterState.gender || 
      filterState.qualification || 
      filterState.maxQualification
    );
  }

  // === SHORTLIST STATE MANAGEMENT METHODS ===

  // Set shortlist state
  setShortlistState(state: any): void {
    this.shortlistStateSubject.next(state);

  }

  // Clear shortlist state
  clearShortlistState(): void {
    this.shortlistStateSubject.next(null);
  }

  // Check if shortlist state exists
  hasShortlistState(): boolean {
    return this.shortlistStateSubject.value !== null;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token available. Please login again.');
    }
    
    if (token === 'verified') {
      throw new Error('Invalid authentication token. Please login again.');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  uploadResume(file: File): Observable<UploadResumeResponse> {
    const formData = new FormData();
    formData.append('cv_file', file);

    const headers = this.getAuthHeaders();

    return this.http.post<UploadResumeResponse>(
      `${this.apiUrl}/upload-resume`,
      formData,
      { 
        headers,
        // Add timeout and better error handling for large files
        reportProgress: false
      }
    );
  }

  saveFilteredResumes(request: SaveFilteredRequest): Observable<SaveFilteredResponse> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');

    return this.http.post<SaveFilteredResponse>(
      `${this.apiUrl}/save-filtered`,
      request,
      { headers }
    );
  }

  // Shortlist API - Submit ranking with job description file
  submitShortlistWithFile(
    pdfId: number,
    jdFile: File,
    jdTemplate: string,
    searchQuery: string,
    searchOperator: string,
    weightExperience: number,
    weightQualifications: number,
    weightSkills: number
  ): Observable<ShortlistResponse> {


    const formData = new FormData();
    formData.append('pdf_id', pdfId.toString());
    formData.append('jd_file', jdFile);
    formData.append('jd_template', jdTemplate);
    formData.append('search_query', searchQuery);
    formData.append('search_operator', searchOperator);
    formData.append('weight_experience', weightExperience.toString());
    formData.append('weight_qualifications', weightQualifications.toString());
    formData.append('weight_skills', weightSkills.toString());

    const headers = this.getAuthHeaders();

    return this.http.post<ShortlistResponse>(
      `http://3.6.143.181:8504/api/shortlisting/shortlist`,
      formData,
      { headers }
    );
  }

  // Shortlist API - Submit ranking without job description file (using template only)
  submitShortlistWithTemplate(
    pdfId: number,
    jdTemplate: string,
    searchQuery: string,
    searchOperator: string,
    weightExperience: number,
    weightQualifications: number,
    weightSkills: number
  ): Observable<ShortlistResponse> {


    const request = {
      pdf_id: pdfId,
      jd_template: jdTemplate,
      search_query: searchQuery,
      search_operator: searchOperator,
      weight_experience: weightExperience,
      weight_qualifications: weightQualifications,
      weight_skills: weightSkills
    };

    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');

    return this.http.post<ShortlistResponse>(
      `http://3.6.143.181:8504/api/shortlisting/shortlist`,
      request,
      { headers }
    );
  }
} 