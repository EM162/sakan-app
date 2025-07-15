import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {jwtDecode} from 'jwt-decode';
import { HostBooking } from '../../core/models/HostBooking';

interface MyJwtPayload {
  nameid: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class HostListingService {
  private apiUrl = 'https://localhost:7188/api/HostListings';

  constructor(private http: HttpClient) {}

  // Decode hostId (userId) from JWT in session storage
private getHostIdFromToken(): string | null {
  const token = sessionStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwtDecode<any>(token);
    const hostId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    return hostId || null;
  } catch (error) {
    console.error("❌ Failed to decode JWT", error);
    return null;
  }
}


  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
 
  // Get listings for current host
  getMyListings(page: number, pageSize: number, searchTerm: string = ''): Observable<any> {
    const hostId = this.getHostIdFromToken();  
    const headers = this.getAuthHeaders();

    const params = {
      hostId: hostId ?? '',
      page: page.toString(),
      pageSize: pageSize.toString(),
      search: searchTerm
    };

    return this.http.get<{ listings: any[], totalCount: number }>(
      `${this.apiUrl}/my`,
      { headers, params }
    );
  }

  getListingById(id: number): Observable<any> {
    const hostId = this.getHostIdFromToken();
    return this.http.get<any>(`${this.apiUrl}/${id}?hostId=${hostId}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateListing(id: number, data: any): Observable<void> {
    const hostId = this.getHostIdFromToken();
    return this.http.put<void>(`${this.apiUrl}/${id}?hostId=${hostId}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  deleteListing(id: number): Observable<void> {
    const hostId = this.getHostIdFromToken();
    return this.http.delete<void>(`${this.apiUrl}/${id}?hostId=${hostId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getHostBookings(): Observable<HostBooking[]> {
    const hostId = this.getHostIdFromToken();
    const headers = this.getAuthHeaders();
    return this.http.get<HostBooking[]>(`https://localhost:7188/api/HostBooking/host/bookings/${hostId}`, { headers });
  }


}
