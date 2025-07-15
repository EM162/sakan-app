import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RoomDetailsService } from '../../Services/room-details.service';
import { RoomDetailsDto } from '../../../../core/models/room-details.model';
import { BookingRequestDto, ListingDetailsDto } from '../../../../core/models/listing-details.model';
import { ListingDetailsService } from '../../../listings/services/listing-details.service';
import * as L from 'leaflet';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule ],
  selector: 'app-room-details',
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.css'
})
export class RoomDetailsComponent implements OnInit {
  // Data models
  room!: RoomDetailsDto;
  listing!: ListingDetailsDto;

  // State
  moveIn: string = '';
  moveOut: string = '';
  guests: number = 1;
  requestSent: boolean = false;
  hostId: string = '';
  bookedMonths: { year: number; month: number }[] = [];
  monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  currentYear = new Date().getFullYear();
  selectedMonths: { year: number; month: number }[] = [];

  // Map
  listingLatitude: number = 0;
  listingLongitude: number = 0;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomDetailsService,
    private listingService: ListingDetailsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.roomService.getRoomDetails(id).subscribe((data) => {
      this.room = data;
      this.listingLatitude = this.room.listing.latitude;
      this.listingLongitude = this.room.listing.longitude;
      this.initMap();
    });
    this.roomService.getBookedMonths(id).subscribe(data => {
      this.bookedMonths = data;
    });
  }

  // Guest controls
  increaseGuests() { this.guests++; }
  decreaseGuests() { this.guests = Math.max(1, this.guests - 1); }

  // Calendar controls
  nextYear() { this.currentYear++; }
   previousYear() {
  const currentSystemYear = new Date().getFullYear();
  if (this.currentYear > currentSystemYear) {
    this.currentYear--;
  }
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

  // Bed selection
  toggleSelectAllBeds() {
    const allSelected = this.areAllBedsSelected();
    this.room.beds.forEach(bed => {
      if (bed.isAvailable) bed.selected = !allSelected;
    });
  }

  areAllBedsSelected(): boolean {
    return this.room.beds?.filter(b => b.isAvailable).every(b => b.selected);
  }

get selectedBedIds(): number[] {
  return this.room.beds
    ?.filter(b => b.selected && b.id !== null)
    .map(b => b.id as number) || [];
}

  get selectedBedsCount(): number {
    return this.room?.beds.filter(b => b.selected).length || 0;
  }

  get selectedBedsPrice(): number {
    return this.room?.beds
      .filter(b => b.selected)
      .reduce((sum, b) => sum + (b.price || 0), 0) || 0;
  }

  get totalCost(): number {
    return this.room?.beds
      .filter(b => b.selected)
      .reduce((sum, b) => sum + (b.price || 0), 0) || this.room.pricePerNight;
  }

  selectedImage: string | null = null;

  openImageModal(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  closeModal() {
    this.selectedImage = null;
  }

sendBookingRequest(): void {
  const selectedBeds = this.room.beds.filter(bed => bed.selected);
  const guestId = this.listingService.getCurrentUserId();

  if (!guestId) {
    Swal.fire('Error', 'You must be logged in to send a booking request.', 'error');
    return;
  }

  if (!this.moveIn || !this.moveOut) {
    Swal.fire('Warning', 'Please select check-in and check-out months.', 'warning');
    return;
  }

  const hasUnavailableBed = this.room.beds.some(b => !b.isAvailable);
  const isWholeRoomBooking = selectedBeds.length === 0 || selectedBeds.length === this.room.beds.length;

  if (isWholeRoomBooking && hasUnavailableBed) {
    Swal.fire('Sorry', '❌ You cannot book the entire room because one or more beds are already occupied.', 'error');
    return;
  }

  const dto: BookingRequestDto = {
    guestId: guestId!,
    listingId: this.room.listingId,
    roomId: this.room.id,
    bedIds: isWholeRoomBooking ? [] : selectedBeds.map(b => b.id as number),
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
      const msg = err?.error?.message || err?.error?.title || 'An unexpected error occurred while sending the request.';
      Swal.fire('Request Error', msg, 'error');
    }
  });
}


}

