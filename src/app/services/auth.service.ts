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

export interface LoginResendOtpRequest {
  user_id: number;
}

export interface LoginResendOtpResponse {
  message?: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  message: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
}

export interface User {
  id: number;
  email: string;
  fname: string;
  lname: string;
  name?: string; // Computed field from fname + lname
  phone?: string;
  is_admin: boolean;
  cv_access?: boolean;
  [key: string]: any; // Allow any additional properties
}

export interface UsersResponse {
  users?: User[];
  [key: string]: any; // Allow any additional properties
}

export interface UpdateCvAccessRequest {
  user_id: number;
  cv_access: boolean;
}

export interface UpdateCvAccessResponse {
  message: string;
  success?: boolean;
  [key: string]: any; // Allow any additional properties
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://3.6.143.181:8504/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Subject to notify other services about logout
  private logoutSubject = new BehaviorSubject<boolean>(false);
  public logout$ = this.logoutSubject.asObservable();

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
        
        // Extract token - prioritize access_token from login-verify response
        const token = response['access_token'] || response.token || response['authToken'];
        
        // Extract user data - try multiple possible locations and formats
        let user = response.user || response['userData'] || response['profile'];
        
        // If no nested user object found, check if user data is at root level
        if (!user) {
          // User data is at root level - extract from login-verify response
          user = {
            id: response['id'] || response['user_id'],
            fname: response['fname'],
            lname: response['lname'], 
            email: response['email'],
            phone: response['phone'],
            is_admin: response['is_admin'] || false,
            cv_access: response['cv_access'] || false,
            // Create composite name for compatibility
            name: response['fname'] && response['lname'] 
              ? `${response['fname']} ${response['lname']}`
              : response['fname'] || response['lname'] || '',
            ...response // Include any other fields
          };
        }
        
        if (token) {
          console.log('Storing token and user data:', { 
            tokenLength: token.length, 
            tokenStart: token.substring(0, 20) + '...', 
            user 
          });
          localStorage.setItem('auth_token', token);
          
          if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
            this.currentUserSubject.next(user);
            console.log('User stored with is_admin:', user.is_admin);
          }
          
          // Verify token was stored correctly
          const storedToken = localStorage.getItem('auth_token');
          console.log('Token verification - stored correctly:', storedToken === token);
        } else {
          console.error('No access_token found in login-verify response!');
          console.log('Available response keys:', Object.keys(response));
          
          // If we have user data but no token, still store the user
          if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
            this.currentUserSubject.next(user);
            console.log('User stored (no token) with is_admin:', user.is_admin);
          }
          
          // Don't store placeholder token - this will prevent API calls
          console.error('Cannot proceed without valid JWT token');
        }
      })
    );
  }

  resendLoginOtp(data: LoginResendOtpRequest): Observable<LoginResendOtpResponse> {
    return this.http.post<LoginResendOtpResponse>(
      `${this.baseUrl}/login-resend-otp`, 
      data, 
      this.httpOptions
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.logoutSubject.next(true);
  }

  // Enhanced isAuthenticated method that checks token expiration  
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('Token has expired, logging out user');
      this.logout();
      return false;
    }

    return true;
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${this.baseUrl}/forgot-password`, 
      data, 
      this.httpOptions
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.baseUrl}/change-password`, 
      data, 
      this.httpOptions
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<ChangePasswordResponse>(
      `${this.baseUrl}/reset-password`, 
      data, 
      { headers }
    );
  }

  // Get all users (admin only)
  getUsers(): Observable<UsersResponse> {
    const token = this.getToken();
    console.log('getUsers: Retrieved token:', token);
    console.log('getUsers: Token type:', typeof token);
    console.log('getUsers: Token length:', token?.length);
    
    if (!token || token === 'verified') {
      console.error('getUsers: Invalid or missing token');
      throw new Error('No valid authentication token found');
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    console.log('getUsers: Authorization header:', headers.get('Authorization'));
    
    return this.http.get<UsersResponse>(
      `${this.baseUrl.replace('/auth', '')}/users/`,
      { headers }
    );
  }

  // Update user CV access (admin only)
  updateCvAccess(data: UpdateCvAccessRequest): Observable<UpdateCvAccessResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.patch<UpdateCvAccessResponse>(
      `${this.baseUrl.replace('/auth', '')}/users/cv_access`,
      data,
      { headers }
    );
  }

  // Check if current user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_admin === true;
  }

  // Decode JWT token to get expiration
  private decodeToken(token: string): any {
    try {
      if (!token || token === 'verified') {
        console.warn('Invalid token for decoding:', token);
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format - expected 3 parts, got:', parts.length);
        return null;
      }
      
      let payload = parts[1];
      
      // Add padding if needed for proper base64 decoding
      while (payload.length % 4) {
        payload += '=';
      }
      
      // Replace URL-safe characters with standard base64 characters
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(payload);
      const parsed = JSON.parse(decoded);
      console.log('Decoded token payload:', { exp: parsed.exp, iat: parsed.iat, currentTime: Math.floor(Date.now() / 1000) });
      return parsed;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token || token === 'verified') {
      return true;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  // Get token expiration time in minutes
  getTokenTimeRemaining(): number {
    const token = this.getToken();
    if (!token || token === 'verified') {
      return 0;
    }

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = decoded.exp - currentTime;
    return Math.max(0, Math.floor(timeRemaining / 60)); // Return minutes
  }

} 