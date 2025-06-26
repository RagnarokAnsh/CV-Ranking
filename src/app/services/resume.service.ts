import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface ResumeData {
  id?: string;
  name: string;
  nationality: string;
  experience: number;
  age?: number; // Coming Soon feature
  qualification: string;
  gender?: string;
  languages?: string[];
  employmentHistory?: string;
  [key: string]: any; // Allow additional properties from API
}

export interface UploadResumeResponse {
  message: string;
  pdf_id: number;
  rows: number;
  data: ResumeData[];
}

export interface SaveFilteredRequest {
  pdf_id: number;
  data: ResumeData[] | any[]; // Allow both transformed and original data formats
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
  [key: string]: any; // Allow any additional fields
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
  
  public resumeData$ = this.resumeDataSubject.asObservable();
  public filteredResumeData$ = this.filteredResumeDataSubject.asObservable();
  public pdfId$ = this.pdfIdSubject.asObservable();
  public filterState$ = this.filterStateSubject.asObservable();

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

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Getting auth headers, token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.error('No authentication token found!');
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  uploadResume(file: File): Observable<UploadResumeResponse> {
    console.log('Starting upload for file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const formData = new FormData();
    formData.append('cv_file', file);

    // Debug: Log FormData entries
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const headers = this.getAuthHeaders();
    console.log('Upload headers:', headers.keys());
    console.log('Authorization header:', headers.get('Authorization'));

    return this.http.post<UploadResumeResponse>(
      `${this.apiUrl}/upload-resume`,
      formData,
      { headers }
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
    console.log('Starting shortlist submission with file:', {
      pdfId,
      jdFile: jdFile.name,
      jdTemplate,
      searchQuery,
      searchOperator,
      weights: { weightExperience, weightQualifications, weightSkills }
    });

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
    console.log('Starting shortlist submission with template only:', {
      pdfId,
      jdTemplate,
      searchQuery,
      searchOperator,
      weights: { weightExperience, weightQualifications, weightSkills }
    });

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