import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './services/chat.service';
import { MessageDto } from '../../core/models/messageDto';
import { ChatHubService } from './services/chat-hub.service';
import { ChatDto } from '../../core/models/chatDto';
import { AuthService } from '../auth/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ChatConfirmationModalComponent } from './components/chat-confirmation-modal/chat-confirmation-modal.component';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NoChatsComponent } from './components/app-no-chats/app-no-chats.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  constructor(
    private chatService: ChatService,
    private chatHubService: ChatHubService,
    private authService: AuthService,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  chats: ChatDto[] = [];

  selectedChat: any = null;
  messages: MessageDto[] = [];
  newMessage: string = '';
  isConnected: boolean = false;
  currentUserId: any;
  listingTitle: string = 'Default Listing Title';
  HostID: string = 'host-123';
  ListingID: string = '4';

  message: MessageDto = {
    senderID: '',
    receiverID: '',
    content: '',
    chatId: 0,
  };

  async ngOnInit() {
    // Dialog
    const dialogRef = this.dialog.open(ChatConfirmationModalComponent);
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) {
      console.log('Chat confirmation cancelled');
      return;
    }
  
    this.currentUserId = this.authService.getUserIdFromToken()?.toString().trim();
    this.chatHubService.startConnection(this.currentUserId);

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
        }
      }
    });

    // Get chats
    this.chatService.getUserChats(this.currentUserId).subscribe({
      next: async (chats) => {
        this.chats = chats;
  
        this.route.queryParams.subscribe(async (params) => {
          const hostId = params['hostId'];
          const listingId = params['listingId'];
        
          this.currentUserId = this.authService.getUserIdFromToken()?.toString().trim();
        
          if (hostId && listingId) {
            try {
              const chat = await this.chatService.createChatIfNotExists(
                this.currentUserId,
                hostId,
                +listingId
              );

              if (chat) {
                this.DisplayConfirmationDialog();
                this.selectedChat = {
                  ...chat,
                  receiverID: hostId,
                };
                await this.loadChatHistory(chat.chatId);
              }
            } catch (error) {
              console.error('Error creating chat:', error);
            }
          }

          this.getChatsByUserId(this.currentUserId);
          this.chatHubService.startConnection(this.currentUserId);
        });
      },
      error: (err) => {
        console.error('Error fetching chats', err);
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
  }

  async DisplayNoChatsDialog(){
    const dialogRef = this.dialog.open(NoChatsComponent);
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (!confirmed) {
      console.log('No chats confirmation cancelled');
      return;
    }
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
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.messages = [];
    }
  }

  getChatsByUserId(userId: string) {
    this.chatService.getUserChats(userId).subscribe({
      next: (chats) => {
        if (!chats || !Array.isArray(chats)) {
          console.error('Invalid chats response', chats);
          return;
        }

        this.chats = chats;
        console.log('Loaded chats:', this.chats);
      },
      error: (err) => {
        console.error('Error fetching user chats:', err);
      },
    });
  }

  getOtherParticipant(chat: ChatDto): string {
    if (!chat.lastMessage) return 'Unknown';

    return chat.lastMessage.senderID === this.currentUserId
      ? chat.lastMessage.receiverID
      : chat.lastMessage.senderID;
  }

  getLatestMessage(chat: ChatDto): string {
    if (!chat.lastMessage) return 'Unknown';

    return chat.lastMessage.content || 'No messages yet';
  }

  getListingTitle(chat: ChatDto): string {
    if (!chat.lastMessage) return 'Unknown';

    return chat.ListingTitle || 'No messages yet';
  }

  getUserName(chat: ChatDto): string {
    if (!chat.userName) return 'Unknown';

    return chat.userName || 'No messages yet';
  }
}
