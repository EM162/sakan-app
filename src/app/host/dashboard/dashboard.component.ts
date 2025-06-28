import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  selectedTab: 'today' | 'upcoming' = 'today';

  constructor() {}

  selectTab(tab: 'today' | 'upcoming'): void {
    this.selectedTab = tab;
  }

  isTabSelected(tab: 'today' | 'upcoming'): boolean {
    return this.selectedTab === tab;
  }
}
