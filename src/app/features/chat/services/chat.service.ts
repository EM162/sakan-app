import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { BookingRQSDTO, CheckAvailabilityDto, UserChatSummary } from '../../../core/models/messageDto';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'https://localhost:7188/api/chat';
  private serverUrl = `https://localhost:7188/api`;

  constructor(private http: HttpClient) {}

  // Get user chats (لـ sidebar)
  getUserChats(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/${userId}/chats`);
  }

  // Get messages of a chat
  getChatHistory(chatId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/history/${chatId}`);
  }

  // Send a message
  sendMessage(message: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/send`, message);
  }

  // Create a chat
  createChat(listingId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, { listingId });
  }

  createChatIfNotExists(senderId: string, receiverId: string, listingId: number): Promise<UserChatSummary> {
    const body = { senderId, receiverId, listingId };
    return firstValueFrom(this.http.post<UserChatSummary>(`${this.baseUrl}/CreateChatIfNotExists`, body));
  }

  approveBooking(chatId: number, bookingId: number, isHost: boolean, userId : string): Promise<any> {
    const body = { chatId, bookingId, isHost , userId};
    return firstValueFrom(this.http.post(`${this.baseUrl}/approve-booking`, body));
  }

  getBookingId(chatId: number, guestId: string): Observable<number> {
    const params = {
      chatId: chatId.toString(),
      guestId
    };
  
    return this.http.get<number>(`${this.baseUrl}/get-booking-id`, { params });
  }
  

  getApprovalStatus(bookingId: number, userId: string, isHost: boolean): Observable<any> {
    const params = {
      bookingId: bookingId.toString(),
      userId,
      isHost: isHost.toString()
    };
  
    return this.http.get<any>(`${this.baseUrl}/approval-status`, { params });
  }

  getBookingRequestById(id: number): Observable<BookingRQSDTO> {
    return this.http.get<BookingRQSDTO>(`${this.serverUrl}/bookingrequest/${id}`);
  }

  checkAvailability(dto: CheckAvailabilityDto): Observable<{ available: boolean }> {
    return this.http.post<{ available: boolean }>(`${this.serverUrl}/bookingservice/check-availability`, dto);
  }
  
  
  
}
