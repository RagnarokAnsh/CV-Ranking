import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { NavbarComponent } from '../shared/navbar/navbar.component';

// Interface for HR candidate data
interface HRCandidate {
  name: string;
  email: string;
  phone: string;
  status: 'approved' | 'rejected';
}

@Component({
  selector: 'app-admin-approval',
  standalone: true,
  imports: [CommonModule, TableModule, NavbarComponent],
  templateUrl: './admin-approval.component.html',
  styleUrls: ['./admin-approval.component.scss']
})
export class AdminApprovalComponent implements OnInit {
  hrCandidates: HRCandidate[] = [];
  
  // Paginator properties
  rowsPerPage: number = 10;
  totalRecords: number = 0;
  showPaginator: boolean = false;

  ngOnInit(): void {
    this.loadCandidates();
  }

  private loadCandidates(): void {
    // Mock data - replace with actual API call
    this.hrCandidates = [
      { 
        name: 'Raman Singh', 
        email: 'ramansingh@gmail.com',
        phone: '9823567234',
        status: 'approved' 
      },
      { 
        name: 'Naina Kapoor', 
        email: 'nainakapoor@gmail.com',
        phone: '9989994567',
        status: 'approved' 
      },
      { 
        name: 'Ayaan Mallick', 
        email: 'ayaanmallick@gmail.com',
        phone: '8799654569',
        status: 'rejected' 
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
      default:
        return 'pi pi-question';
    }
  }
}
