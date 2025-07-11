import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUserDto {
  id: string;
  userName: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private apiUrl = 'https://localhost:7188/api/admin/users';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getHosts(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>(`${this.apiUrl}/hosts`, { headers: this.getAuthHeaders() });
  }

  getGuests(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>(`${this.apiUrl}/guests`, { headers: this.getAuthHeaders() });
  }

  updateUser(userId: string, dto: {id:string; userName: string; email: string }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}`, dto, { headers: this.getAuthHeaders() });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`, { headers: this.getAuthHeaders() });
  }
}
