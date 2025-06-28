import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-host-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterOutlet, RouterLink],
  templateUrl: './host-layout.component.html',
  styleUrl: './host-layout.component.css'
})
export class HostLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isMobile = false;

  constructor() {}

  ngOnInit(): void {
    this.checkScreenSize();
    // Check if user preference for sidebar state exists in localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null && !this.isMobile) {
      this.isSidebarCollapsed = JSON.parse(savedSidebarState);
    }
  }

  ngOnDestroy(): void {
    // Save sidebar state to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(this.isSidebarCollapsed));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    const previousMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    // If switching from desktop to mobile, ensure sidebar is collapsed
    if (!previousMobile && this.isMobile) {
      this.isSidebarCollapsed = true;
    }
    // If switching from mobile to desktop, restore saved state or default to expanded
    else if (previousMobile && !this.isMobile) {
      const savedSidebarState = localStorage.getItem('sidebarCollapsed');
      this.isSidebarCollapsed = savedSidebarState ? JSON.parse(savedSidebarState) : false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    
    // Save state only on desktop
    if (!this.isMobile) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(this.isSidebarCollapsed));
    }
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.isSidebarCollapsed = true;
    }
  }

  logout(): void {
    // Implement logout logic here
    console.log('Logging out...');
    
    // Example logout implementation:
    // Clear authentication tokens
    // localStorage.removeItem('authToken');
    // sessionStorage.clear();
    
    // Navigate to login page
    // this.router.navigate(['/login']);
    
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
      // Perform logout
      this.performLogout();
    }
  }

  private performLogout(): void {
    // Clear any stored user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Reset sidebar state
    localStorage.removeItem('sidebarCollapsed');
    
    // Navigate to login page (uncomment when router is available)
    // this.router.navigate(['/login']);
    
    console.log('User logged out successfully');
  }

  // Method to handle navigation clicks on mobile
  onNavClick(): void {
    if (this.isMobile) {
      this.closeSidebar();
    }
  }

  // Method to get current route info (can be enhanced with Router service)
  getCurrentRoute(): string {
    return window.location.pathname;
  }

  // Method to check if current route is active
  isRouteActive(route: string): boolean {
    return this.getCurrentRoute().includes(route);
  }}
