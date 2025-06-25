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
  data: ResumeData[];
}

export interface SaveFilteredResponse {
  message?: string;
  success?: boolean;
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
} 