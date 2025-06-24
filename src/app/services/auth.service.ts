import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface RegisterRequest {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  dateofbirth: string;
  gender: string;
  country: string;
  nationality: string;
  cv_access: boolean;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginVerifyRequest {
  user_id: number;
  otp: string;
}

export interface LoginResponse {
  user_id?: number;
  id?: number;
  userId?: number;
  message?: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
}

export interface LoginVerifyResponse {
  token?: string;
  user?: any;
  message?: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
}

export interface RegisterResponse {
  message?: string;
  success?: boolean;
  user_id?: number;
  [key: string]: any; // Allow any additional properties
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://3.6.143.181:8504/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');
    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.baseUrl}/register`, 
      userData, 
      this.httpOptions
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`, 
      credentials, 
      this.httpOptions
    );
  }

  verifyLogin(verifyData: LoginVerifyRequest): Observable<LoginVerifyResponse> {
    return this.http.post<LoginVerifyResponse>(
      `${this.baseUrl}/login-verify`, 
      verifyData, 
      this.httpOptions
    ).pipe(
      tap(response => {
        console.log('Tap operator - OTP verification response:', response);
        
        // If we get a response (200 status), try to extract token and user data
        const token = response.token || response['access_token'] || response['authToken'];
        const user = response.user || response['userData'] || response['profile'];
        
        if (token) {
          console.log('Storing token and user data');
          localStorage.setItem('auth_token', token);
          if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        } else {
          console.log('No token found in response, but verification was successful');
          // Even without token, we can consider the verification successful
          // Store a placeholder token if needed
          localStorage.setItem('auth_token', 'verified');
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
} 