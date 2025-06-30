import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@microsoft/signalr';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HostListingService } from '../HostListing.service';

@Component({
  selector: 'app-host-listings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './host-listings.component.html',
  styleUrl: './host-listings.component.css'
})

export class HostListingsComponent implements OnInit {
  listings: any[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 5;

  constructor(
    private listingService: HostListingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadListings();
  }

  viewListing(id: number): void {
  this.router.navigate(['/listing', id]);
}

  // loadListings(): void {
  //   this.listingService.getMyListings().subscribe({
  //     next: (data) => this.listings = data,
  //     error: (err) => console.error('Failed to load listings', err)
  //   });
  // }

    loadListings(): void {
    this.listingService.getMyListings(this.page, this.pageSize).subscribe(response => {
      this.listings = response.listings;
      this.totalCount = response.totalCount;
    });
  }

  nextPage() {
    if (this.page * this.pageSize < this.totalCount) {
      this.page++;
      this.loadListings();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadListings();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  editListing(id: number): void {
    this.router.navigate(['/host/editlisting', id]);
  }

  deleteListing(id: number): void {
    if (confirm('Are you sure you want to delete this listing?')) {
      this.listingService.deleteListing(id).subscribe({
        next: () => this.loadListings(),
        error: (err) => alert('Delete failed: ' + err.message)
      });
    }
  }
}