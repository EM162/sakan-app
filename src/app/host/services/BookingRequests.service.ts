import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookingRequest {
  bookingRequestId: number;
  guestId: string;
  guestName: string;
  listingTitle: string;
  roomTitle: string;
  bedTitle: string;
  listingLocation: string;
  createdAt: string;
  fromDate: string;
  toDate: string;
  isApproved: string; // Changed to string to match API response
}

@Injectable({ providedIn: 'root' })
export class BookingRequestsService {
  private apiUrl = 'https://localhost:7188/api/BookingRequest';

  constructor(private http: HttpClient) {}

  private getHostId(): string | null {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (
        payload[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ] || null
      );
    } catch {
      return null;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getBookingRequests(): Observable<BookingRequest[]> {
    const hostId = this.getHostId();
    return this.http.get<BookingRequest[]>(`${this.apiUrl}/host/${hostId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateBookingRequest(
    requestId: number,
    isAccepted: boolean
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/update/${requestId}/${isAccepted}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
