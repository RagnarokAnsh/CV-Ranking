import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { AuthService, User, UpdateCvAccessRequest } from '../services/auth.service';

// Interface for display data
interface UserDisplay extends User {
  name: string;
  status: 'approved' | 'rejected';
}

@Component({
  selector: 'app-admin-approval',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, NavbarComponent],

  templateUrl: './admin-approval.component.html',
  styleUrls: ['./admin-approval.component.scss']
})
export class AdminApprovalComponent implements OnInit {
  hrCandidates: UserDisplay[] = [];
  selectedCandidate: UserDisplay | null = null;
  showActionDialog: boolean = false;
  
  // Paginator properties
  rowsPerPage: number = 10;
  totalRecords: number = 0;
  showPaginator: boolean = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
  }

  private loadCandidates(): void {
    console.log('Loading candidates...');
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Is admin:', this.authService.isAdmin());
    console.log('Auth token:', this.authService.getToken());
    
    this.authService.getUsers().subscribe({
      next: (response) => {
        console.log('Raw API response:', response);
        
        // Handle different response formats
        let users = [];
        if (Array.isArray(response)) {
          users = response;
        } else if (response.users && Array.isArray(response.users)) {
          users = response.users;
        } else if (response['data'] && Array.isArray(response['data'])) {
          users = response['data'];
        } else {
          console.warn('Unexpected response format:', response);
          users = [];
        }
        
        console.log('Extracted users array:', users);
        
        // Convert User objects to UserDisplay format
        this.hrCandidates = users.map(user => ({
          ...user,
          name: user.name || `${user.fname || ''} ${user.lname || ''}`.trim() || 'Unknown User',
          status: user.cv_access ? 'approved' : 'rejected'
        }));
        
        // Update paginator settings
        this.updatePaginatorSettings();
        
        console.log('Final processed candidates:', this.hrCandidates);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);
        
        let errorMessage = 'Failed to load users. Please try again.';
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'You do not have permission to access this data. Admin access required.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Load Error',
          detail: errorMessage
        });
        
        // Initialize empty array on error
        this.hrCandidates = [];
        this.updatePaginatorSettings();
      }
    });
  }

  private updatePaginatorSettings(): void {
    this.totalRecords = this.hrCandidates.length;
    // Show paginator only when there are more than 5 entries
    this.showPaginator = this.totalRecords > 5;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'pi pi-check';
      case 'rejected':
        return 'pi pi-times';
      case 'pending':
        return 'pi pi-clock';
      default:
        return 'pi pi-question';
    }
  }

  onRowClick(candidate: UserDisplay): void {
    this.selectedCandidate = candidate;
    this.showActionDialog = true;
  }

  approveCandidate(): void {
    if (this.selectedCandidate) {
      const updateData: UpdateCvAccessRequest = {
        user_id: this.selectedCandidate.id,
        cv_access: true
      };

      this.authService.updateCvAccess(updateData).subscribe({
        next: (response) => {
          this.selectedCandidate!.status = 'approved';
          this.selectedCandidate!.cv_access = true;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || `${this.selectedCandidate!.name} has been approved`
          });

          console.log('User approved successfully:', response);
          this.closeDialog();
        },
        error: (error) => {
          console.error('Error approving user:', error);
          
          let errorMessage = 'Failed to approve user. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Approval Failed',
            detail: errorMessage
          });
        }
      });
    }
  }

  rejectCandidate(): void {
    if (this.selectedCandidate) {
      const updateData: UpdateCvAccessRequest = {
        user_id: this.selectedCandidate.id,
        cv_access: false
      };

      this.authService.updateCvAccess(updateData).subscribe({
        next: (response) => {
          this.selectedCandidate!.status = 'rejected';
          this.selectedCandidate!.cv_access = false;
          
          this.messageService.add({
            severity: 'warn',
            summary: 'Rejected',
            detail: response.message || `${this.selectedCandidate!.name} access has been rejected`
          });

          console.log('User rejected successfully:', response);
          this.closeDialog();
        },
        error: (error) => {
          console.error('Error rejecting user:', error);
          
          let errorMessage = 'Failed to reject user. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Rejection Failed',
            detail: errorMessage
          });
        }
      });
    }
  }

  closeDialog(): void {
    this.showActionDialog = false;
    this.selectedCandidate = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }
}
