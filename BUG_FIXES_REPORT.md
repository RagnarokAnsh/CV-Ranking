# Bug Fixes Report

This document details the 3 bugs found and fixed in the CV-Ranking Angular application codebase.

## Bug 1: Memory Leak in AppComponent 🐛

**Severity**: Medium  
**Type**: Performance Issue  
**Location**: `src/app/app.component.ts`

### Problem Description
The `AppComponent` subscribes to `AuthService.currentUser$` in the `ngOnInit` method but never unsubscribes from it in `ngOnDestroy`. This creates a memory leak as the subscription remains active even after the component is destroyed.

### Impact
- **Memory Leaks**: Accumulating subscriptions consume memory over time
- **Performance Degradation**: Can slow down the application with prolonged usage
- **Potential Crashes**: In extreme cases, can cause the browser to run out of memory

### Root Cause
Missing subscription management following Angular best practices for Observable cleanup.

### Solution Applied
Implemented the `takeUntil` pattern for proper subscription management:

```typescript
// Added proper imports
import { Subject, takeUntil } from 'rxjs';

// Added destroy subject
private destroy$ = new Subject<void>();

// Modified subscription to use takeUntil
this.authService.currentUser$
  .pipe(takeUntil(this.destroy$))
  .subscribe((user: any) => {
    // ... subscription logic
  });

// Added proper cleanup in ngOnDestroy
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.sessionTimerService.stopSessionTimer();
}
```

---

## Bug 2: Swapped API Endpoints in AuthService 🔄

**Severity**: High  
**Type**: Logic Error  
**Location**: `src/app/services/auth.service.ts`

### Problem Description
The `resetPassword` and `changePassword` methods have their API endpoints swapped:
- `resetPassword()` was calling `/change-password` endpoint
- `changePassword()` was calling `/reset-password` endpoint

### Impact
- **Authentication Failures**: Users cannot properly reset or change passwords
- **User Experience**: Broken password management functionality
- **API Errors**: Wrong data being sent to wrong endpoints causing 400/500 errors

### Root Cause
Copy-paste error or incorrect endpoint mapping during development.

### Solution Applied
Corrected the endpoint URLs to match their intended functionality:

```typescript
// Fixed resetPassword to use correct endpoint
resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
  return this.http.post<ResetPasswordResponse>(
    `${this.baseUrl}/reset-password`,  // Changed from /change-password
    data, 
    this.httpOptions
  );
}

// Fixed changePassword to use correct endpoint  
changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
  // ... headers setup
  return this.http.post<ChangePasswordResponse>(
    `${this.baseUrl}/change-password`,  // Changed from /reset-password
    data, 
    { headers }
  );
}
```

---

## Bug 3: Unsafe JWT Token Decoding 🔐

**Severity**: Medium  
**Type**: Security/Stability Issue  
**Location**: `src/app/services/auth.service.ts`, `decodeToken()` method

### Problem Description
The JWT token decoding method uses `atob()` directly without handling URL-safe base64 encoding or proper padding, which can cause runtime errors with malformed tokens.

### Impact
- **Runtime Errors**: Malformed JWT tokens cause `DOMException` errors
- **Application Crashes**: Unhandled exceptions can crash the authentication flow
- **Security Concerns**: Improper token handling could expose the app to token-related attacks

### Root Cause
JWT tokens use URL-safe base64 encoding (using `-` and `_` instead of `+` and `/`) and may not have proper padding, but the code was using standard base64 decoding.

### Solution Applied
Enhanced the token decoding to properly handle JWT base64url encoding:

```typescript
private decodeToken(token: string): any {
  try {
    // ... validation checks
    
    let payload = parts[1];
    
    // Add padding if needed for proper base64 decoding
    while (payload.length % 4) {
      payload += '=';
    }
    
    // Replace URL-safe characters with standard base64 characters
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    const decoded = atob(payload);
    const parsed = JSON.parse(decoded);
    // ... rest of method
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}
```

---

## Summary

### Total Bugs Fixed: 3
- **1 Performance Issue** (Memory Leak)
- **1 Logic Error** (Swapped Endpoints) 
- **1 Security/Stability Issue** (Unsafe Token Decoding)

### Impact Assessment
- **High Priority**: Bug 2 (broken authentication flow)
- **Medium Priority**: Bug 1 & 3 (performance and stability improvements)

### Testing Recommendations
1. **Memory Testing**: Monitor memory usage during extended application sessions
2. **Authentication Testing**: Verify password reset and change functionality works correctly
3. **Token Testing**: Test with various JWT token formats, including malformed tokens

All fixes maintain backward compatibility and follow Angular/TypeScript best practices.