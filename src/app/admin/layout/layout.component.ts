import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HostListener } from '@angular/core';



@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isSidebarCollapsed = false;
  activeMenuItem = 'dashboard';
  hasActiveRoute = false; // This would be determined by router state in real app

  menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { id: 'guests', label: 'Users', icon: 'people', route: '/admin/users' },
   // { id: 'hosts', label: 'Hosts', icon: 'person_pin', route: '/admin/hosts' },
    { id: 'listings-approval', label: 'Approve / Reject Listings', icon: 'approval', route: '/admin/approvelistings' },
   //  { id: 'complaints', label: 'View & Manage Complaints', icon: 'report_problem', route: '/admin/complaints' },
    { id: 'listings', label: 'Listings Management', icon: 'home_work', route: '/admin/listings' },
    { id: 'Approve Hosts', label: 'Hosts Management', icon: 'person_pin', route: '/admin/approveHost' }
  ];

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  setActiveMenuItem(itemId: string): void {
    this.activeMenuItem = itemId;
  }
}
