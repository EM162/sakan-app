import { Component, OnInit } from '@angular/core';
import { ListingDetailsService } from '../../services/listing-details.service';
import { BookingRequestDto, ListingAmenity, ListingDetailsDto, ReviewDto } from '../../../../core/models/listing-details.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../../../core/services/translation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule],
  selector: 'app-listing-details',
  templateUrl: './listing-details.component.html',
  styleUrls: ['./listing-details.component.css']
})
export class ListingDetailsComponent implements OnInit {
  listing!: ListingDetailsDto;
  moveIn: string = '';
  moveOut: string = '';
  hostId: string = '';
  translatedDesc: string = '';
  translatedTitle: string = '';
  guests: number = 1;
  requestSent: boolean = false;
  bookedMonths: { year: number; month: number }[] = [];
  selectedMonths: { year: number; month: number }[] = [];
  currentYear = new Date().getFullYear();
  monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  listingLatitude: number = 0;
  listingLongitude: number = 0;
  listingReviews: ReviewDto[] = [];
  showAllReviews = false;

  // listingAmenities: ListingAmenity[] = [];

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingDetailsService,
    private router: Router,
    private translationService: TranslationService,
    private translate: TranslateService
  ) {
    const lang = localStorage.getItem('lang') || 'en';
    translate.use(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.listingService.getListingDetails(id).subscribe((data) => {
      this.listing = data;
      this.listingLatitude = this.listing.latitude;
      this.listingLongitude = this.listing.longitude;
      // this.loadAmenities();
      setTimeout(() => {
        this.initMap();
      }, 0);
    });

    this.listingService.getBookedMonths(id).subscribe(data => {
      this.bookedMonths = data;
      console.log('📅 Booked Months:', this.bookedMonths);
    });

    this.listingService.getListingReviews(id).subscribe(reviews => {
      this.listingReviews = reviews;
    });

  }

//   loadAmenities(): void {
//   this.listingService.getListingAmenities(this.listing.id).subscribe(data => {
//     this.listingAmenities = data;
//   });
// }

  increaseGuests() { this.guests++; }
  decreaseGuests() { this.guests = Math.max(1, this.guests - 1); }
  nextYear() { this.currentYear++; }
  previousYear() {
  const currentSystemYear = new Date().getFullYear();
  if (this.currentYear > currentSystemYear) {
    this.currentYear--;
  }
}


  currentLang = localStorage.getItem('lang') || 'en';
  switchLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', this.currentLang);
    location.reload();
  }
  translateData() {
    const lang = localStorage.getItem('lang') || 'en';

    this.translationService.translate(this.listing.title, lang).subscribe(res => {
      this.translatedTitle = res.translated;
    });

    this.translationService.translate(this.listing.description, lang).subscribe(res => {
      this.translatedDesc = res.translated;
    });
  }

  selectedImage: string | null = null;

  openImageModal(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  closeModal() {
    this.selectedImage = null;
  }

selectMonth(month: number) {
  const now = new Date();
  const isPastMonth = 
    this.currentYear < now.getFullYear() ||
    (this.currentYear === now.getFullYear() && month < now.getMonth() + 1);

  if (isPastMonth) return; // 🚫 Don't allow selecting past months

  if (this.isMonthBooked(this.currentYear, month)) return;

  const exists = this.selectedMonths.find(m => m.year === this.currentYear && m.month === month);
  if (exists) {
    this.selectedMonths = this.selectedMonths.filter(m => !(m.year === this.currentYear && m.month === month));
  } else {
    this.selectedMonths.push({ year: this.currentYear, month });
  }

  this.updateMoveDatesFromSelection();
}


  updateMoveDatesFromSelection() {
    if (this.selectedMonths.length === 0) {
      this.moveIn = '';
      this.moveOut = '';
      return;
    }
    const sorted = [...this.selectedMonths].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const firstMonthStr = first.month.toString().padStart(2, '0');
    const lastMonthStr = last.month.toString().padStart(2, '0');
    const lastDay = new Date(last.year, last.month, 0).getDate();
    this.moveIn = `${first.year}-${firstMonthStr}-01`;
    this.moveOut = `${last.year}-${lastMonthStr}-${lastDay}`;
  }

  isMonthBooked(year: number, month: number): boolean {
    return this.bookedMonths.some(m => m.year === year && m.month === month);
  }

  isMonthSelected(month: number): boolean {
    return this.selectedMonths.some(sel => sel.year === this.currentYear && sel.month === month);
  }

  get monthRanges(): { start: string, end: string }[] {
    if (this.selectedMonths.length === 0) return [];
    const sorted = [...this.selectedMonths].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    const ranges: { start: string, end: string }[] = [];
    let rangeStart = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const isConsecutive = (current.year === prev.year && current.month === prev.month + 1) ||
        (current.year === prev.year + 1 && prev.month === 12 && current.month === 1);
      if (!isConsecutive) {
        ranges.push({ start: this.formatMonth(rangeStart), end: this.formatMonth(prev) });
        rangeStart = current;
      }
      prev = current;
    }
    ranges.push({ start: this.formatMonth(rangeStart), end: this.formatMonth(prev) });
    return ranges;
  }

  formatMonth(m: { year: number, month: number }): string {
    const date = new Date(m.year, m.month - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  initMap(): void {
    const map = L.map('map').setView([this.listingLatitude, this.listingLongitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    map.invalidateSize(); 
    L.marker([this.listingLatitude, this.listingLongitude]).addTo(map)
      .bindPopup('Apartment location')
      .openPopup();
  }

  get selectedRoomCount(): number {
    return this.listing.bedroomList?.filter(r => r.selected)?.length || 0;
  }

  get selectedRoomsTotal(): number {
    return this.listing.bedroomList
      ?.filter(r => r.selected)
      .reduce((acc, r) => acc + (r.pricePerNight || 0), 0) || 0;
  }

  get totalCost(): number {
    const totalRooms = this.listing.bedroomList?.length || 0;
    const selectedRooms = this.listing.bedroomList?.filter(r => r.selected) || [];
    const allRoomsSelected = selectedRooms.length === totalRooms && totalRooms > 0;
    if (allRoomsSelected) {
      return this.listing.pricePerMonth || 0;
    }
    return selectedRooms.reduce((acc, r) => acc + (r.pricePerNight || 0), 0) || this.listing.pricePerMonth;
  }

  get selectedRooms() {
    return this.listing?.bedroomList?.filter(r => r.selected);
  }

  goToRoom(roomId: number) {
    this.router.navigate(['/room', roomId]);
  }

  get allRoomsSelected(): boolean {
    const totalRooms = this.listing.bedroomList?.length || 0;
    const selectedRooms = this.listing.bedroomList?.filter(r => r.selected) || [];
    return selectedRooms.length === totalRooms && totalRooms > 0;
  }

  sendBookingRequest(): void {
  const selectedRooms = this.listing.bedroomList.filter(room => room.selected);
  const guestId = this.listingService.getCurrentUserId();

  if (!guestId) {
    Swal.fire('Error', 'You must be logged in to send a booking request.', 'error');
    return;
  }

  if (!this.moveIn || !this.moveOut) {
    Swal.fire('Missing Dates', 'Please select check-in and check-out months.', 'warning');
    return;
  }

  if (selectedRooms.length === 0) {
    const hasUnavailableBed = this.listing.bedroomList.some(room =>
      room.beds?.some(bed => !bed.isAvailable)
    );

    if (hasUnavailableBed) {
      Swal.fire(
        'Unavailable Beds',
        "Sorry, you can't book the entire apartment because a room or bed is already booked.\nPlease choose a specific room to proceed.",
        'error'
      );
      return;
    }

    // Booking the whole apartment
    const dto: BookingRequestDto = {
      guestId: guestId!,
      listingId: this.listing.id,
      bedIds: [],
      fromDate: new Date(this.moveIn).toISOString(),
      toDate: new Date(this.moveOut).toISOString(),
      createdAt: new Date()
    };

    this.listingService.createRequest(dto).subscribe({
      next: (res) => {
        this.requestSent = true;
        this.hostId = res.hostId;
        Swal.fire('Success', 'Your request has been sent successfully!', 'success');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error?.title || 'An error occurred while sending the request.';
        Swal.fire('Request Error', msg, 'error');
      }
    });
  } else {
    // Booking per selected room
    selectedRooms.forEach(room => {
      const bedIds = room.beds?.filter(b => b.selected).map(b => b.id) ?? [];

      const dto: BookingRequestDto = {
        guestId: guestId!,
        listingId: this.listing.id,
        roomId: room.id,
        bedIds: [],
        fromDate: new Date(this.moveIn).toISOString(),
        toDate: new Date(this.moveOut).toISOString(),
        createdAt: new Date()
      };

      this.listingService.createRequest(dto).subscribe({
        next: (res) => {
          this.requestSent = true;
          this.hostId = res.hostId;
          Swal.fire('Success', 'Your request has been sent successfully!', 'success');
        },
        error: (err) => {
          const msg = err?.error?.message || err?.error?.title || 'An error occurred while sending the request.';
          Swal.fire('Request Error', msg, 'error');
        }
      });
    });
  }
}

}
