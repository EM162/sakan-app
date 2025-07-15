import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { MessageDto } from '../../../core/models/messageDto';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ChatHubService {
  private hubConnection!: signalR.HubConnection;
  private connectionPromise: Promise<void> | null = null;
  private isInitialized = false;

  private messageSubject = new Subject<MessageDto>();
  private connectionStatusSubject = new Subject<boolean>();

  message$ = this.messageSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  private bookingRequestSubject = new Subject<any>();
  public bookingRequest$ = this.bookingRequestSubject.asObservable();

  private receivingNewChatSubject = new Subject<void>();
public receivingNewChat$ = this.receivingNewChatSubject.asObservable();
  

  /**
   * Start SignalR connection if not already connected.
   * Safe to call multiple times.
   */
  public async startConnection(userId: string): Promise<void> {
    if (
      this.hubConnection &&
      this.hubConnection.state === signalR.HubConnectionState.Connected
    ) {
      return;
    }

    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.serverUrl}/ChatHub?userId=${userId}`)
        .withAutomaticReconnect()
        .build();

      this.setupListeners(); // only once
    }

    await this.ensureConnection();
  }

  /**
   * Setup SignalR listeners
   */
  private setupListeners(): void {
    if (this.isInitialized) return;

    this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
      message.timestamp = new Date(message.timestamp ?? new Date());
      console.log('[SignalR] Received message:', message);
      this.messageSubject.next(message);
    });

    this.hubConnection.on('ReceiveBookingRequestInfo', (data) => {
      console.log('Received booking info:', data);
      this.bookingRequestSubject.next(data);
    });

    this.hubConnection.on('ReceiveBookingStatusUpdate', (data: any) => {
      // console.log('[SignalR] Booking status update received:', data);
      this.bookingRequestSubject.next(data);
      this.showBookingStatusAlert(data);
    });

   this.hubConnection.on('ReceivingNewChat', () => {
  console.log('ReceivingNewChat event received');
  this.receivingNewChatSubject.next();
});


    this.isInitialized = true;
  }

  /**
   * Ensure SignalR connection is active
   */
  private async ensureConnection(): Promise<void> {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected)
      return;

    if (!this.connectionPromise) {
      this.connectionPromise = this.hubConnection
        .start()
        .then(() => {
          console.log('[SignalR] Connection established');
          this.connectionStatusSubject.next(true);
        })
        .catch((err) => {
          console.error('[SignalR] Connection failed:', err);
          this.connectionStatusSubject.next(false);
          throw err;
        })
        .finally(() => {
          this.connectionPromise = null;
        });
    }

    return this.connectionPromise;
  }

  /**
   * Send message through SignalR
   */
  public async sendMessage(message: MessageDto): Promise<void> {
    try {
      await this.ensureConnection();
      await this.hubConnection.invoke('SendMessage', message);
    } catch (error) {
      console.error('[SignalR] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .catch((err) =>
          console.error('[SignalR] Error stopping connection:', err)
        );
      this.connectionStatusSubject.next(false);
    }
  }

  public async invokeChatWithHost(
    listingId: number,
    guestId: string
  ): Promise<void> {
    try {
      await this.ensureConnection();
      await this.hubConnection.invoke('ChatWithHost', listingId, guestId);
    } catch (error) {
      console.error('Error invoking ChatWithHost:', error);
      throw error;
    }
  }

  async showBookingStatusAlert(data: {
    guestApproved: boolean;
    hostApproved: boolean;
    listingTitle: string;
    status: string;
    userName: string;
  }) {
    const statusMessage = {
      GoToPayment: 'Booking approved! Please proceed to payment.',
      PendingHost: 'Guest approved. Waiting for host confirmation.',
      PendingGuest: 'Host approved. Waiting for guest confirmation.',
      Approved: 'Booking fully approved!',
      PendingUserBooking: 'Guest needs to book first.',
    };

    Swal.fire({
      title: `Booking Update - ${data.listingTitle}`,
      html: `
      <strong>${data.userName}</strong> updated the booking status.<br><br>
      <b>Status:</b> ${data.status}<br>
      <b>Guest Approved:</b> ${data.guestApproved ? '✅ Yes' : '❌ No'}<br>
      <b>Host Approved:</b> ${data.hostApproved ? '✅ Yes' : '❌ No'}
    `,
      icon: 'info',
      confirmButtonText: 'OK',
      timer: 7000,
      timerProgressBar: true,
    });
  }

  public async invokeNotifyWhenChattingWithHost(receiverId: string): Promise<void> {
  if (!this.hubConnection) {
    console.error('SignalR connection is not established.');
    return;
  }

  try {
    await this.hubConnection.invoke('NotifyWhenChattingWithHost', receiverId);
    console.log(`NotifyWhenChattingWithHost invoked for receiverId: ${receiverId}`);
  this.receivingNewChatSubject.next();

  } catch (err) {
    console.error('Error invoking NotifyWhenChattingWithHost:', err);
  }
}

}
