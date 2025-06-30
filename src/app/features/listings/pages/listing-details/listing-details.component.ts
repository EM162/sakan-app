import { Component, OnInit } from '@angular/core';
import { ListingDetailsService } from '../../services/listing-details.service';
import { BookingRequestDto, ListingDetailsDto } from '../../../../core/models/listing-details.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslationService } from '../../../../core/services/translation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule ],
  selector: 'app-listing-details',
  templateUrl: './listing-details.component.html',
  styleUrls: ['./listing-details.component.css']
})
export class ListingDetailsComponent implements OnInit {
  // Data models
  listing!: ListingDetailsDto;

  // State
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

  // Map
  listingLatitude: number = 0;
  listingLongitude: number = 0;

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

      // Set coordinates dynamically
      this.listingLatitude = this.listing.latitude;
      this.listingLongitude = this.listing.longitude;

      // Initialize the map after coordinates are set
      this.initMap();
    });

    this.listingService.getBookedMonths(id).subscribe(data => {
      this.bookedMonths = data;
    });
  }

  //------------------------------------------------------

  // Guest controls
  increaseGuests() { this.guests++; }
  decreaseGuests() { this.guests = Math.max(1, this.guests - 1); }
  // Calendar controls
  nextYear() { this.currentYear++; }
  previousYear() { this.currentYear--; }

  //------------------------------------------------------

  // Translations
  currentLang = localStorage.getItem('lang') || 'en';
  switchLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', this.currentLang);
    location.reload(); // reload to fetch translated data from backend
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

  //------------------------------------------------------
  // Month selection (calendar)

  selectMonth(month: number) {
    const exists = this.selectedMonths.find(m => m.year === this.currentYear && m.month === month);
    if (exists) {
      this.selectedMonths = this.selectedMonths.filter(m => !(m.year === this.currentYear && m.month === month));
    } else {
      if (!this.isMonthBooked(this.currentYear, month)) {
        this.selectedMonths.push({ year: this.currentYear, month });
      }
    }
    this.updateMoveDatesFromSelection();
  }

  updateMoveDatesFromSelection() {
    if (this.selectedMonths.length === 0) {
      this.moveIn = '';
      this.moveOut = '';
      return;
    }
    const sorted = [...this.selectedMonths].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
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
    const sorted = [...this.selectedMonths].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
    const ranges: { start: string, end: string }[] = [];
    let rangeStart = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const isConsecutive =
        (current.year === prev.year && current.month === prev.month + 1) ||
        (current.year === prev.year + 1 && prev.month === 12 && current.month === 1);
      if (!isConsecutive) {
        ranges.push({
          start: this.formatMonth(rangeStart),
          end: this.formatMonth(prev),
        });
        rangeStart = current;
      }
      prev = current;
    }
    ranges.push({
      start: this.formatMonth(rangeStart),
      end: this.formatMonth(prev),
    });
    return ranges;
  }

  formatMonth(m: { year: number, month: number }): string {
    const date = new Date(m.year, m.month - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  //------------------------------------------------------

  // Map
  initMap(): void {
    const map = L.map('map').setView([this.listingLatitude, this.listingLongitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([this.listingLatitude, this.listingLongitude]).addTo(map)
      .bindPopup('Apartment location')
      .openPopup();
  }

  //------------------------------------------------------

  // Room selection and cost
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
    const allRoomsSelected = selectedRooms.length === totalRooms;
    if (allRoomsSelected && totalRooms > 0) {
      return (this.listing.pricePerMonth || 0);
    }
    const selectedRoomSum = selectedRooms.reduce((acc, r) => acc + (r.pricePerNight || 0), 0);
    return selectedRoomSum;
  }

  get allRoomsSelected(): boolean {
    return this.listing.bedroomList?.every(r => r.selected) || false;
  }

  get selectedRooms() {
    return this.listing?.bedroomList?.filter(r => r.selected);
  }

  goToRoom(roomId: number) {
    this.router.navigate(['/room', roomId]);
  }

  //------------------------------------------------------

  // Booking
  sendBookingRequest(): void {
    const selectedRooms = this.listing.bedroomList.filter(room => room.selected);
    const guestId = this.listingService.getCurrentUserId();
    if (!this.moveIn || !this.moveOut) {
      alert('Please select check-in and check-out months.');
      return;
    }
    if (selectedRooms.length === 0) {
      // Booking the whole apartment
      const dto: BookingRequestDto = {
        guestId,
        listingId: this.listing.id,
        fromDate: new Date(this.moveIn).toISOString(),
        toDate: new Date(this.moveOut).toISOString()
      };
      this.listingService.createRequest(dto).subscribe(res => {
        this.requestSent = true;
        this.hostId = res.hostId;
        alert('Your request has been sent successfully!');
      });
    } else {
      // Booking individual rooms
      selectedRooms.forEach(room => {
        const dto: BookingRequestDto = {
          guestId,
          listingId: this.listing.id,
          roomId: room.id,
          fromDate: new Date(this.moveIn).toISOString(),
          toDate: new Date(this.moveOut).toISOString()
        };
        this.listingService.createRequest(dto).subscribe(res => {
          this.requestSent = true;
          this.hostId = res.hostId;
          alert('Your request has been sent successfully!');
        });
      });
    }
  }
}
