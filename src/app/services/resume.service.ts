import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private baseUrl = 'http://3.6.143.181:8504/api/resume';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

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
      `${this.baseUrl}/upload-resume`,
      formData,
      { headers }
    );
  }

  saveFilteredResumes(request: SaveFilteredRequest): Observable<SaveFilteredResponse> {
    const headers = this.getAuthHeaders().set('Content-Type', 'application/json');

    return this.http.post<SaveFilteredResponse>(
      `${this.baseUrl}/save-filtered`,
      request,
      { headers }
    );
  }
} 