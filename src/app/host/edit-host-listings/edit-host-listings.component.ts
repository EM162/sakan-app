import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HostListingService } from '../HostListing.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-host-listings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './edit-host-listings.component.html',
  styleUrl: './edit-host-listings.component.css'
})

export class EditHostListingComponent implements OnInit {
  listingForm: FormGroup;
  listingId!: number;
  isLoading = true;
  photoInput: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private HostListingService: HostListingService
  ) {
    this.listingForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      pricePerMonth: ['', Validators.required],
      maxGuests: ['', Validators.required],
      governorate: [''],
      district: [''],
      isBookableAsWhole: [false],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.listingId = +this.route.snapshot.paramMap.get('id')!;
    this.loadListing();
  }

  loadListing(): void {
    this.HostListingService.getListingById(this.listingId).subscribe({
      next: (data) => {
        this.listingForm.patchValue(data); 
        this.isLoading = false;
      },
      error: (err) => {
        alert('Failed to load listing.');
        this.router.navigate(['/host/listings']);
      }
    });
  }

  // updatePhotoUrls(): void {
  //   const urls = this.photoInput
  //     .split(',')
  //     .map(url => url.trim())
  //     .filter(url => url);
  //   this.listingForm.patchValue({ photoUrls: urls });
  // }


  onSubmit(): void {
    if (this.listingForm.valid) {
      this.HostListingService.updateListing(this.listingId, this.listingForm.value).subscribe(() => {
        alert('Listing updated successfully!');
        this.router.navigate(['/host/listings']);
      });
    }
  }


}