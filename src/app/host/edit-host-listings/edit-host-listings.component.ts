import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HostListingService } from '../HostListing.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-edit-host-listings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './edit-host-listings.component.html',
  styleUrl: './edit-host-listings.component.css'
})
export class EditHostListingComponent implements OnInit {
  listingForm: FormGroup;
  listingId!: number;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private hostListingService: HostListingService,
    private toastr: ToastrService
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
    this.hostListingService.getListingById(this.listingId).subscribe({
      next: (data) => {
        this.listingForm.patchValue(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load listing.', 'Error');
        this.router.navigate(['/host/listings']);
      }
    });
  }

  onSubmit(): void {
    if (this.listingForm.valid) {
      const data = this.listingForm.value;
      this.hostListingService.updateListing(this.listingId, data).subscribe({
        next: () => {
          this.toastr.success('Listing updated successfully! ✅');
          this.router.navigate(['/host/listings']);
        },
        error: (err) => {
          console.error('Update failed:', err);
          this.toastr.error('Failed to update listing ❌', 'Error');
        }
      });
    } else {
      this.toastr.warning('Please fill in all required fields.', 'Form Invalid');
    }
  }
}
