import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './services/chat.service';
import { BookingRQSDTO, CheckAvailabilityDto, MessageDto } from '../../core/models/messageDto';
import { ChatHubService } from './services/chat-hub.service';
import { ChatDto } from '../../core/models/chatDto';
import { AuthService } from '../auth/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ChatConfirmationModalComponent } from './components/chat-confirmation-modal/chat-confirmation-modal.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { NoChatsComponent } from './components/app-no-chats/app-no-chats.component';
import { Router } from '@angular/router';
import { ApproveConfirmationModalComponent } from './components/approve-confirmation-modal/approve-confirmation-modal';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer')
  private chatMessagesContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private chatHubService: ChatHubService,
    private authService: AuthService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,

  ) { }

  scrollToBottom(): void {
    setTimeout(() => {
      try {
        const container = this.chatMessagesContainer?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      } catch (err) {
        console.error('Scroll failed', err);
      }
    }, 100);
  }

  selectedChat: any = null;
  messages: MessageDto[] = [];
  newMessage: string = '';
  isConnected: boolean = false;

  approvalStatus: string = '';
  chats: ChatDto[] = [];
  currentUserId: any;
  LatestBookingStatus: string = 'This is default booking status';
  private destroy$ = new Subject<void>();
  disableApproveButton: boolean = false;




  message: MessageDto = {
    senderID: '',
    receiverID: '',
    content: '',
    chatId: 0,
  };

  async ngOnInit() {

    this.chatHubService.bookingRequest$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.handleBookingNotification(data);
      });

    this.currentUserId = this.authService
      .getUserIdFromToken()
      ?.toString()
      .trim();
    this.chatHubService.startConnection(this.currentUserId);

    if (this.isHost()){
    this.chatHubService.receivingNewChat$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        alert('You have a new message!');
        console.log('Real-time: New chat notification received');
        this.getChatsByUserId();
      });
    }



    this.chatHubService.connectionStatus$.subscribe((connected) => {
      this.isConnected = connected;
    });

    this.chatHubService.message$.subscribe((message: MessageDto) => {
      if (message.chatId === this.selectedChat?.chatId) {
        const exists = this.messages.some(
          (m) =>
            m.timestamp === message.timestamp &&
            m.content === message.content &&
            m.senderID === message.senderID
        );
        if (!exists) {
          this.messages.push(message);
          this.scrollToBottom();
        }
      }
    });

    // Get chats
    this.getChatsByUserId();
    this.chatService.getUserChats(this.currentUserId).subscribe({
      next: async (chats) => {
        // this.chats = chats;

        const queryParams = this.route.snapshot.queryParams;
        const hostId = queryParams['hostId'];
        const listingId = queryParams['listingId'];

        if (chats.length === 0 && !hostId && !listingId) {
          console.warn('No chats found for user:', this.currentUserId);
          await this.DisplayNoChatsDialog();
          return;
        }

        this.route.queryParams.subscribe({
          next: async (params) => {
            const hostId = params['hostId'];
            const listingId = params['listingId'];

            console.log('Query params:', params);

            this.currentUserId = this.authService
              .getUserIdFromToken()
              ?.toString()
              .trim();

            if (hostId && listingId) {
              try {
                const chat = await this.chatService.createChatIfNotExists(
                  this.currentUserId,
                  hostId,
                  +listingId
                );

                if (chat) {
                  await this.DisplayConfirmationDialog();

                  this.selectedChat = {
                    ...chat,
                    receiverID: hostId,
                  };

                  await this.loadChatHistory(chat.chatId);

                  await this.chatHubService.invokeChatWithHost(
                    +listingId,
                    this.currentUserId
                  );

                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: {},
                    replaceUrl: true,
                  });

                  await this.chatHubService.invokeNotifyWhenChattingWithHost(this.selectedChat.receiverID);

                }
              } catch (error) {
                console.error('Error creating chat:', error);
              }
            } else {
              this.getChatsByUserId();
            }
          },
          error: (err) => {
            console.error('Error in queryParams subscription:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching chats:', err);
      },
    });

  }

  ngOnDestroy() {
    // Stop SignalR connection
    this.chatHubService.stopConnection();
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedChat) return;

    const messageDto: MessageDto = {
      senderID: this.currentUserId,
      receiverID: this.selectedChat.receiverID,
      content: this.newMessage,
      chatId: +this.selectedChat.chatId,
      timestamp: new Date(),
    };

    try {
      this.messages.push({
        ...messageDto,
        senderID: this.currentUserId.toString().trim(),
        receiverID: this.selectedChat.receiverID.toString().trim(),
      });

      this.newMessage = '';
      this.scrollToBottom();

      // Send via SignalR
      await this.chatHubService.sendMessage(messageDto);
    } catch (signalrError) {
      console.warn('SignalR failed, using HTTP fallback');

      this.chatService.sendMessage(messageDto).subscribe({
        next: (serverMessage) => {
          const index = this.messages.findIndex(
            (m) =>
              m.timestamp === messageDto.timestamp &&
              m.content === messageDto.content
          );

          if (index !== -1) {
            this.messages[index] = serverMessage;
          } else {
            this.messages.push(serverMessage);
          }
        },
        error: (httpError) => {
          console.error('HTTP send failed:', httpError);
          this.messages = this.messages.filter(
            (m) =>
              m.timestamp !== messageDto.timestamp ||
              m.content !== messageDto.content
          );
        },
      });
    }
  }

  async selectChat(chat: any) {
    if (!chat?.chatId) {
      console.error('Invalid chat object: missing chatId');
      return;
    }

    let receiverID = '';

    if (chat.lastMessage) {
      receiverID =
        chat.lastMessage.senderID === this.currentUserId
          ? chat.lastMessage.receiverID
          : chat.lastMessage.senderID;
    } else {
      receiverID = prompt('Enter receiver ID for this chat:') || '';
    }

    this.selectedChat = {
      ...chat,
      receiverID,
    };
    await this.loadChatHistory(chat.chatId);
    const bookingId = await this.GetBookingId(
      chat.chatId,
      this.GetGuestIdIfHost(chat)
    );
    this.GetBookingStatus(bookingId, this.currentUserId, this.isHost());
  }

  async DisplayNoChatsDialog() {
    const dialogRef = this.dialog.open(NoChatsComponent);
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) {
      console.log('No chats confirmation cancelled');

      this.router.navigate(['/home']);
      return;
    }
  }

  async DisplayApproveDialog() {
    const dialogRef = this.dialog.open(ApproveConfirmationModalComponent);
    const result = await dialogRef.afterClosed().toPromise();

    if (result === 'confirm') {
      console.log('User confirmed');
    } else if (result === 'cancel') {
      console.log('User cancelled');
    }
    return result;
  }

  async DisplayConfirmationDialog() {
    const dialogRef = this.dialog.open(ChatConfirmationModalComponent);
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) {
      console.log('Chat confirmation cancelled');
      return;
    }
  }

  private async loadChatHistory(chatId: number) {
    try {
      const history = await this.chatService.getChatHistory(chatId).toPromise();

      this.messages = (history || []).map((message: any) => ({
        ...message,
        senderID:
          message.senderID?.toString().trim() ||
          message.senderId?.toString().trim() ||
          '',
        receiverID:
          message.receiverID?.toString().trim() ||
          message.receiverId?.toString().trim() ||
          '',
        timestamp: new Date(message.timestamp),
      }));

      console.log(this.messages, 'Chat history loaded:', this.messages);

      this.scrollToBottom();
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.messages = [];
    }
  }

  GetGuestIdIfHost(chat: ChatDto): string {
    const guestId = this.isHost()
      ? chat.lastMessage?.senderID === this.currentUserId
        ? chat?.lastMessage?.receiverID
        : chat?.lastMessage?.senderID
      : this.currentUserId;
    return guestId;
  }

  getChatsByUserId() {
    this.chatService.getUserChats(this.currentUserId).subscribe({
      next: async (chats) => {
        this.chats = chats;
        console.log('User id : ' + this.currentUserId);
        console.log('IS HOST: ', this.isHost());

        // this.chats.forEach((chat) => {
        //   const guestId = this.GetGuestIdIfHost(chat);

        //   this.chatService.getBookingId(chat.chatId, guestId).subscribe({
        //     next: (bookingId) => {
        //       console.log('Booking ID for chat', chat.chatId, ':', bookingId);

        //       this.chatService
        //         .getApprovalStatus(bookingId, this.currentUserId, this.isHost())
        //         .subscribe({
        //           next: (approvalStatus) => {
        //             chat.listingStatus = approvalStatus.status;
        //             this.approvalStatus = approvalStatus.status;
        //             console.log(chat.chatId, bookingId, 'Approval status:', chat.listingStatus);
        //           },
        //           error: (err) => {
        //             console.error('Error getting approval status:', err);
        //           },
        //         });
        //     },
        //     error: (err) => {
        //       console.error('Error getting booking ID:', err);
        //     },
        //   });
        // });
      },
      error: (err) => {
        console.error('Error fetching chats:', err);
      },
    });
  }

  //not used
  getOtherParticipant(chat: ChatDto): string {
    if (!chat.lastMessage) return 'Unknown';

    return chat.lastMessage.senderID === this.currentUserId
      ? chat.lastMessage.receiverID
      : chat.lastMessage.senderID;
  }

  //not used
  getLatestMessage(chat: ChatDto): string {
    if (!chat.lastMessage) return 'Unknown';

    return chat.lastMessage.content || 'No messages yet';
  }

  //not used
  getListingTitle(chat: ChatDto): string {
    if (!chat.lastMessage) return 'Unknown';

    return chat.listingTitle || 'No messages yet';
  }
  //not used

  getUserName(chat: ChatDto): string {
    if (!chat.userName) return 'Unknown';

    return chat.userName || 'No messages yet';
  }

  isHost(): boolean {
    let userRole;
    const roles = this.authService.getRoleFromToken();
    console.log('User roles from token:', roles);

    if (roles) {
      console.log(roles[0]);
      userRole = roles[0];
      return userRole === 'Host';
    }
    return false;
  }
  async onApproveClick(selectedChat: ChatDto) {
    console.log('Approve Button Clicked, Approving Booking...');


    const result = await this.DisplayApproveDialog();
    console.log(result, 'Dialog result');
    if (result === 'confirm') {
      if (!this.selectedChat) return;
      try {
        const bookingId = await this.GetBookingId(
          selectedChat.chatId,
          this.GetGuestIdIfHost(selectedChat)
        );
        if (!bookingId) {
          console.error('Booking ID not found for chat:', selectedChat.chatId);
          return;
        }
        console.log('Booking Id: ' + bookingId);

        const isHost = this.isHost();

        const isAvailable = await this.checkListingAvailability(bookingId);
        console.log(isAvailable);
        if (!isAvailable) {
          Swal.fire({
            icon: 'error',
            title: 'Not Available',
            text: 'this listing is not Available in the current dates',
            confirmButtonText: 'Okey'
          });
          return;
        } else {
          console.log('Available!');
        }
          
        const approvalResult = await this.chatService.approveBooking(
          selectedChat.chatId,
          bookingId,
          isHost,
          this.currentUserId
        );

        console.log("Approval result:", approvalResult);

        this.approvalStatus = approvalResult?.status;
        console.log('Approval status updated:', this.approvalStatus);

        switch (this.approvalStatus) {
          case 'GoToPayment':
            // show "Pay Now" button
            break;
          case 'PendingHost':
            // show "Waiting for host approval"

            break;
          case 'PendingGuest':
            // show "Waiting for guest approval"
            break;
          case 'PendingUserBooking':
            // show "Guest needs to book"
            break;
          case 'Approved':
            // show "Booking Confirmed"
            break;
          default:
            // handle other states
            break;
        }
      } catch (error) {
        console.error('Approval failed', error);
      }
    } else {
      console.log('User cancelled approval.');
    }
  }

  handleBookingNotification(data: any) {
    const message = `${data.approverName} ${data.status === 'GoToPayment'
        ? 'approved the booking, please proceed to payment.'
        : data.status === 'PendingHost'
          ? 'approved the request. Waiting for host confirmation.'
          : data.status === 'PendingGuest'
            ? 'approved the request. Waiting for guest confirmation.'
            : 'updated booking status.'
      }`;

    console.log("Real time From Chat Componenet. TS After Approve Booking", data);

    this.approvalStatus = data.status;
    console.log('Booking status: From Chat Componenet', this.approvalStatus);

  }


  shouldShowApproveButton(): boolean {
    if (!this.selectedChat) return false;

    switch (this.approvalStatus) {
      case 'ApprovedByHost':
        return !this.isHost();
      case 'ApprovedByGuest':
        return this.isHost();
      case 'RejectedByHost':
        return this.isHost();
      case 'RejectedByGuest':
        return !this.isHost();
      case 'PendingUserBooking':
      case 'GoToPayment':
        return !this.isHost();
      case 'Pending':
      default:
        return true;
    }
  }

  shouldDisableApproveButton(): boolean {
    switch (this.approvalStatus) {
      case 'ApprovedByHost':
        return this.isHost();
      case 'ApprovedByGuest':
        return !this.isHost();
      case 'RejectedByHost':
        return !this.isHost();
      case 'RejectedByGuest':
        return this.isHost();
      case 'PendingUserBooking':
      case 'GoToPayment':
        return true;
      case 'Pending':
      default:
        return false;
    }
  }

  async goToPayment() {
    try {
      if (!this.selectedChat) return;

      const guestId = this.GetGuestIdIfHost(this.selectedChat);
      const bookingId = await this.GetBookingId(this.selectedChat.chatId, guestId);

      if (bookingId) {
        this.router.navigate(['/payment', bookingId]);
      }
    } catch (error) {
      console.error('Go to payment failed:', error);

      this.toastr.error('Something went wrong. Please try again.');
    }
  }

  async GetBookingId(chatId: number, guestId: string): Promise<number> {
    try {
      const bookingId = await firstValueFrom(
        this.chatService.getBookingId(chatId, guestId)
      );
      console.log('Booking ID for chat', chatId, ':', bookingId);
      return bookingId;
    } catch (err) {
      console.error('Error getting booking ID:', err);
      return 0;
    }
  }
  GetBookingStatus(bookingId: number, userId: string, isHost: boolean) {
    this.chatService
      .getApprovalStatus(bookingId, this.currentUserId, this.isHost())
      .subscribe({
        next: (BookingStatus) => {
          this.approvalStatus = BookingStatus.status;
          console.log(
            'Booking Id: ',
            bookingId,
            'Approval status: ',
            this.approvalStatus
          );
          console.log('Booking Status: ', BookingStatus);
        },
        error: (err) => {
          console.error('Error getting approval status:', err);
        },
      });
  }

  BookingStatusToString(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Waiting for both to approve';
      case 'ApprovedByHost':
        return 'Host approved. Waiting for guest';
      case 'ApprovedByGuest':
        return 'Guest approved. Waiting for host';
      case 'RejectedByHost':
        return 'Host rejected the booking';
      case 'RejectedByGuest':
        return 'Guest rejected the booking';
      case 'PendingUserBooking':
        return 'Waiting for guest to book';
      case 'GoToPayment':
        return 'Booking approved! Proceed to payment';
      case 'Approved':
        return 'Booking Confirmed';
      default:
        return status || 'Unknown Status';
    }
  }


  async checkListingAvailability(bookingId: number): Promise<boolean> {
    try {
      const bookingRQSDTO = await firstValueFrom(
        this.chatService.getBookingRequestById(bookingId)
      );
  
      if (!bookingRQSDTO.fromDate || !bookingRQSDTO.toDate) {
        console.error('Missing fromDate or toDate');
        return false;
      }
  
      const checkDto: CheckAvailabilityDto = {
        listingId: bookingRQSDTO.listingId,
        roomId: bookingRQSDTO.roomId,
        bedId: bookingRQSDTO.bedId,
        fromDate: new Date(bookingRQSDTO.fromDate),
        toDate: new Date(bookingRQSDTO.toDate)
      };
  
      const result = await firstValueFrom(
        this.chatService.checkAvailability(checkDto)
      );
  
      return result.available;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }
}
