import { Component, OnInit } from '@angular/core';
import {
  BookingRequestsService,
  BookingRequest,
} from '../services/BookingRequests.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-requests.component.html',
  styleUrl: './booking-requests.component.css',
})
export class BookingRequestsComponent implements OnInit {
  requests: BookingRequest[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private bookingRequestsService: BookingRequestsService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.bookingRequestsService.getBookingRequests().subscribe({
      next: (res) => {
        this.requests = res;
        console.log(this.requests);
        this.sortByCreatedAt(); // apply default sort on load
        this.loading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to load requests ❌', 'error');
        this.loading = false;
      },
    });
  }

  updateRequest(requestId: number, isAccepted: boolean): void {
    this.bookingRequestsService
      .updateBookingRequest(requestId, isAccepted)
      .subscribe({
        next: () => {
          Swal.fire(
            'Success',
            isAccepted ? 'Request approved ✅' : 'Request rejected 🚫',
            'success'
          );
          this.loadRequests(); // refresh after update
        },
        error: () => Swal.fire('Error', 'Failed to update request ❌', 'error'),
      });
  }

  sortByCreatedAt(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.requests.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Reset to page 1 after sorting to avoid confusion
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.requests.length / this.pageSize);
  }

  get paginatedRequests(): BookingRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.requests.slice(start, start + this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
