import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { NavbarComponent } from '../shared/navbar/navbar.component';

// Interface for HR candidate data
interface HRCandidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'approved' | 'rejected' | 'pending';
}

@Component({
  selector: 'app-admin-approval',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToastModule, DialogModule, NavbarComponent],
  providers: [MessageService],
  templateUrl: './admin-approval.component.html',
  styleUrls: ['./admin-approval.component.scss']
})
export class AdminApprovalComponent implements OnInit {
  hrCandidates: HRCandidate[] = [];
  selectedCandidate: HRCandidate | null = null;
  showActionDialog: boolean = false;
  
  // Paginator properties
  rowsPerPage: number = 10;
  totalRecords: number = 0;
  showPaginator: boolean = false;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadCandidates();
  }

  private loadCandidates(): void {
    // Mock data - replace with actual API call
    this.hrCandidates = [
      { 
        id: 1,
        name: 'Raman Singh', 
        email: 'ramansingh@gmail.com',
        phone: '9823567234',
        status: 'approved' 
      },
      { 
        id: 2,
        name: 'Naina Kapoor', 
        email: 'nainakapoor@gmail.com',
        phone: '9989994567',
        status: 'approved' 
      },
      { 
        id: 3,
        name: 'Ayaan Mallick', 
        email: 'ayaanmallick@gmail.com',
        phone: '8799654569',
        status: 'rejected' 
      },
      { 
        id: 4,
        name: 'Priya Sharma', 
        email: 'priyasharma@gmail.com',
        phone: '9876543210',
        status: 'pending' 
      },
      { 
        id: 5,
        name: 'Arjun Patel', 
        email: 'arjunpatel@gmail.com',
        phone: '8765432109',
        status: 'pending' 
      },
      { 
        id: 6,
        name: 'Sneha Reddy', 
        email: 'snehareddy@gmail.com',
        phone: '7654321098',
        status: 'pending' 
      }
    ];
    
    // Update paginator settings
    this.updatePaginatorSettings();
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

  onRowClick(candidate: HRCandidate): void {
    this.selectedCandidate = candidate;
    this.showActionDialog = true;
  }

  approveCandidate(): void {
    if (this.selectedCandidate) {
      const previousStatus = this.selectedCandidate.status;
      this.selectedCandidate.status = 'approved';
      
      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${this.selectedCandidate.name} has been approved${previousStatus !== 'approved' ? '' : ' (status unchanged)'}`
      });

      // TODO: Replace with actual API call
      console.log('Approving candidate:', this.selectedCandidate);
      
      this.closeDialog();
    }
  }

  rejectCandidate(): void {
    if (this.selectedCandidate) {
      const previousStatus = this.selectedCandidate.status;
      this.selectedCandidate.status = 'rejected';
      
      // Show warning message
      this.messageService.add({
        severity: 'warn',
        summary: 'Rejected',
        detail: `${this.selectedCandidate.name} has been rejected${previousStatus !== 'rejected' ? '' : ' (status unchanged)'}`
      });

      // TODO: Replace with actual API call
      console.log('Rejecting candidate:', this.selectedCandidate);
      
      this.closeDialog();
    }
  }

  setPendingStatus(): void {
    if (this.selectedCandidate) {
      const previousStatus = this.selectedCandidate.status;
      this.selectedCandidate.status = 'pending';
      
      // Show info message
      this.messageService.add({
        severity: 'info',
        summary: 'Status Updated',
        detail: `${this.selectedCandidate.name} status set to pending${previousStatus !== 'pending' ? '' : ' (status unchanged)'}`
      });

      // TODO: Replace with actual API call
      console.log('Setting candidate to pending:', this.selectedCandidate);
      
      this.closeDialog();
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
