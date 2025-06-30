import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HostListingService {
  private apiUrl = 'https://localhost:7188/api/HostListings';

  constructor(private http: HttpClient) {}

  // Helper method to set Authorization header
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    console.log("MY TOKEN", token);
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // // Get all listings for the current host
  // getMyListings(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/my`, {
  //     headers: this.getAuthHeaders()
  //   });
  // }

    getMyListings(page = 1, pageSize = 5): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/my?page=${page}&pageSize=${pageSize}`, {
        headers: this.getAuthHeaders()
      });
    }

  // Get a specific listing by ID
  getListingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Update a listing
  updateListing(id: number, data: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete a listing
  deleteListing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
