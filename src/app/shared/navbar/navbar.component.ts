import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { MenuItem } from 'primeng/api';

// Services
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    OverlayPanelModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  sidebarItems: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  currentRoute: string = '';
  sidebarCollapsed: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initializeSidebarItems();
    this.initializeUserMenu();
    this.currentRoute = this.router.url;
    
    // Subscribe to user changes to update sidebar items
    this.authService.currentUser$.subscribe(user => {
      console.log('Navbar: User changed:', user);
      this.initializeSidebarItems(); // Rebuild sidebar when user changes
    });
    
    // Update current route
    this.router.events.subscribe((event: any) => {
      if (event.url) {
        this.currentRoute = event.url;
      }
    });
  }

  initializeSidebarItems() {
    const currentUser = this.authService.getCurrentUser();
    const isAdmin = this.authService.isAdmin();
    
    console.log('Navbar: Building sidebar items');
    console.log('Current user:', currentUser);
    console.log('Is admin:', isAdmin);
    
    const baseItems = [
      {
        label: 'Long List',
        icon: 'pi pi-file-o',
        routerLink: '/longlist',
        command: () => this.navigateTo('/longlist')
      },
      {
        label: 'Short List',
        icon: 'pi pi-file-check',
        routerLink: '/shortlist',
        command: () => this.navigateTo('/shortlist')
      }
    ];

    // Add Admin Approval only for admin users
    if (isAdmin) {
      console.log('Adding Admin Approval to sidebar');
      baseItems.push({
        label: 'Admin Approval',
        icon: 'pi pi-user-edit',
        routerLink: '/admin-approval',
        command: () => this.navigateTo('/admin-approval')
      });
    } else {
      console.log('Not adding Admin Approval - user is not admin');
    }

    // Add common items
    baseItems.push(
      {
        label: 'Help',
        icon: 'pi pi-info-circle',
        routerLink: '/help',
        command: () => this.showHelp()
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        routerLink: '/logout',
        command: () => this.logout()
      }
    );

    this.sidebarItems = baseItems;
    console.log('Final sidebar items:', this.sidebarItems);
  }

  initializeUserMenu() {
    this.userMenuItems = [
      {
        label: 'Change Password',
        icon: 'pi pi-key',
        routerLink: '/change-password',
        command: () => this.navigateTo('/change-password')
      },
      
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  navigateTo(route: string) {
    this.currentRoute = route;
    this.router.navigate([route]);
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route;
  }

  showProfile() {
    // Profile functionality
    console.log('Show profile');
  }

  showSettings() {
    // Settings functionality
    console.log('Show settings');
  }

  showHelp() {
    // Help functionality
    console.log('Show help');
  }

  logout() {
    // Logout functionality
    this.router.navigate(['/login']);
  }

  getPageTitle(): string {
    // Return page title based on current route
    switch (this.currentRoute) {
      case '/admin-approval':
        return 'ADMIN APPROVAL';
      case '/longlist':
        return 'LONG LIST';
      case '/shortlist':
        return 'SHORT LIST';
      default:
        return 'DASHBOARD';
    }
  }

  getRouteFromItem(item: MenuItem): string {
    return item.routerLink || '';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Primary: Use fname and lname from login-verify response
      if (user.fname || user.lname) {
        return `${user.fname || ''} ${user.lname || ''}`.trim();
      }
      // Secondary: Use computed name field if available
      else if (user.name) {
        return user.name;
      } 
      // Fallback: Use email username if no name available
      else if (user.email) {
        return user.email.split('@')[0];
      }
    }
    return 'User';
  }

  getCurrentUserEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || 'user@example.com';
  }
}
