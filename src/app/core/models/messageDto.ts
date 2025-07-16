export interface MessageDto {
  senderID?: string;
  receiverID: string;
  content: string;
  timestamp?: Date;
  chatId?: number;
}

export interface UserChatSummary {
  chatId: number;
  listingId: number;
  listingTitle: string;
  listingStatus: string;
  hostName: string;
  userName: string;
  lastMessage: MessageDto;
}

export interface BookingRQSDTO {
  id: number;
  guestId: string;
  listingId?: number;
  roomId?: number;
  bedId?: number;
  fromDate?: Date;
  toDate?: Date;
  isActive: boolean;
}

export interface CheckAvailabilityDto {
  listingId?: number;
  roomId?: number;
  bedId?: number;
  fromDate: Date;
  toDate: Date;
}
