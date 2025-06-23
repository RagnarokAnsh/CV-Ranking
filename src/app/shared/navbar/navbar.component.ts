import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { MenuItem } from 'primeng/api';

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

  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeSidebarItems();
    this.initializeUserMenu();
    this.currentRoute = this.router.url;
  }

  initializeSidebarItems() {
    this.sidebarItems = [
      {
        label: 'Long List',
        icon: 'pi pi-file-o',
        routerLink: '/longlist',
        command: () => this.navigateTo('/longlist')
      },
      {
        label: 'Short List',
        icon: 'pi pi-file-o',
        routerLink: '/shortlist',
        command: () => this.navigateTo('/shortlist')
      },
      {
        label: 'Admin Approval',
        icon: 'pi pi-user',
        routerLink: '/admin-approval',
        command: () => this.navigateTo('/admin-approval')
      },
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
    ];
  }

  initializeUserMenu() {
    this.userMenuItems = [
      {
        label: 'Reset Password',
        icon: 'pi pi-key',
        routerLink: '/auth/reset-password',
        command: () => this.showProfile()
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
}
