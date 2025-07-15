import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'; 
import { AdminListingService } from '../../Admin/services/admin-listing.service';
// Uncomment the following line if you have a service for listing management
// import { AdminListingService } from '../services/admin-listing.service';

@Component({
  selector: 'app-admin-editlisting',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-editlisting.component.html',
  styleUrl: './admin-editlisting.component.css'
})
export class AdminEditlistingComponent implements OnInit {
  listingForm: FormGroup;
  listingId!: number;
  isLoading = true;
  photoUrls: string[] = [];
  selectedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminListingService: AdminListingService,
    private http: HttpClient
  ) {
    this.listingForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      pricePerMonth: ['', Validators.required],
      maxGuests: ['', Validators.required],
      governorate: [''],
      district: [''],
      isBookableAsWhole: [false],
      isActive: [true],
      photoUrls: this.fb.control<string[]>([])
    });
  }

  ngOnInit(): void {
    this.listingId = +this.route.snapshot.paramMap.get('id')!;
    this.loadListing();
  }

  loadListing(): void {
    this.adminListingService.getListingById(this.listingId).subscribe({
      next: (data) => {
        this.photoUrls = data.photoUrls || [];
        this.listingForm.patchValue({ ...data, photoUrls: this.photoUrls });
        this.isLoading = false;
      },
      error: () => {
        Swal.fire('Error', 'Failed to load listing.', 'error');
        this.router.navigate(['admin/listings']);
      }
    });
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  uploadSelectedPhotos(): void {
    if (this.selectedFiles.length === 0) return;

    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('listingPhotos', file));

    this.http.post<string[]>('https://localhost:7188/api/upload/upload', formData).subscribe({
      next: (urls) => {
        this.photoUrls.push(...urls);
        this.listingForm.patchValue({ photoUrls: this.photoUrls });
        Swal.fire('Success', 'Photos uploaded successfully ✅', 'success');
        this.selectedFiles = [];
      },
      error: () => Swal.fire('Error', 'Failed to upload photos ❌', 'error')
    });
  }

  removePhoto(index: number): void {
    this.photoUrls.splice(index, 1);
    this.listingForm.patchValue({ photoUrls: this.photoUrls });
  }

  onSubmit(): void {
    if (!this.listingForm.valid) {
      Swal.fire('Warning', 'Please complete the required fields.', 'warning');
      return;
    }

    this.listingForm.patchValue({ photoUrls: this.photoUrls });

    this.adminListingService.updateListing(this.listingId, this.listingForm.value).subscribe({
      next: () => {
        Swal.fire('Success', 'Listing updated ✅', 'success').then(() => {
          this.router.navigate(['/admin/listings']);
        });
      },
      error: () => Swal.fire('Error', 'Failed to update listing ❌', 'error')
    });
  }

}
