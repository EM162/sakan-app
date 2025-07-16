import { Routes } from '@angular/router';
import { RegisterComponent } from '../app/features/auth/components/register/register.component';
import { LoginComponent } from '../app/features/auth/components/login/login.component';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
import { ListingsPageComponent } from './features/listings/pages/listings-page/listings-page.component';
import { WishlistPageComponent } from './features/wishlist/pages/wishlist-page/wishlist-page.component';
import { PaymentFormComponent } from './features/checkout/pages/payment-form/payment-form.component';

import { ListingDetailsComponent } from './features/listings/pages/listing-details/listing-details.component';
import { RoomDetailsComponent } from './features/rooms/pages/room-details/room-details.component';
import { NotfoundComponent } from './shared/components/notfound/notfound.component';
import { ChatComponent } from './features/chat/chat.component';
import { CallbackComponent } from './callback/callback.component';
import { HostLayoutComponent } from './host/host-layout/host-layout.component';
import { DashboardComponent } from './host/dashboard/dashboard.component';
import { HostListingsComponent } from './host/host-listings/host-listings.component';
import { EditHostListingComponent } from './host/edit-host-listings/edit-host-listings.component';
import { HostRoomsComponent } from './host/host-rooms/host-rooms.component';
import { AddApartmentComponent } from './host/host-add-apartment/add-apartment.component';
import { HostBookingComponent } from './host/host-booking/host-booking.component';
import { HostUserReviewsComponent } from './host/host-user-reviews/host-user-reviews.component';
import { HostMyReviewsComponent } from './host/host-my-reviews/host-my-reviews.component';
import { BookingRequestsComponent } from './host/booking-requests/booking-requests.component';
import { AboutComponent } from './about/about.component';
import { UserReviewComponent } from './features/UserReviews/user-review/user-review.component';
import { AiComponent } from './ai/ai.component';
import { BecomeHostComponent } from './features/become-host/become-host.component';
import { GoogleCallbackComponent } from './features/auth/google-callback/google-callback.component';
import { ForgetPasswordComponent } from './features/auth/forget-password/forget-password.component';
import { HostGuard } from './guards/host.guard';
import { AdminGuard } from './guards/admin.guard';
import { ProfileComponent } from './features/auth/profile/components/profile/profile.component';
import { LayoutComponent } from '../app/Admin/layout/layout.component';
import { AdminDashboardComponent } from '../app/Admin/admin-dashboard/admin-dashboard.component';
import { AdminListingsComponent } from '../app/Admin/admin-listings/admin-listings.component';
import { AdminEditlistingComponent } from '../app/Admin/admin-editlisting/admin-editlisting.component';
import { AdminHostsApproveComponent } from '../app/Admin/admin-hosts-approve/admin-hosts-approve.component';
import { AdminApproveListingsComponent } from '../app/Admin/listing/listings.component';
import { CreateTicketComponent } from './features/support/components/create-ticket/create-ticket.component';
import { TicketDetailsComponent } from './features/support/components/ticket-details/ticket-details.component';
import { MyTicketsComponent } from './features/support/components/my-tickets/my-tickets.component';
import { AdminUsersComponent } from '../app/Admin/admin-users/admin-users.component';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent },
  { path: 'about', component: AboutComponent },
  {
    path: 'forget-password',
    component: ForgetPasswordComponent,
  },
  { path: 'auth/google/callback', component: GoogleCallbackComponent },
  {
    path: 'reset-password',
    loadComponent: () =>
      import(
        '../app/features/auth/reset-password/reset-password.component'
      ).then((m) => m.ResetPasswordComponent),
  },

  { path: 'Profile/:id', component: ProfileComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'listings', component: ListingsPageComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'ai', component: AiComponent },
  { path: 'wishlist', component: WishlistPageComponent },
  { path: 'payment/:id', component: PaymentFormComponent },
  { path: 'listing/:id', component: ListingDetailsComponent },
  { path: 'room/:id', component: RoomDetailsComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'becomeHost', component: BecomeHostComponent },
  { path: 'review', component: UserReviewComponent },
  { path: 'contact', component: CreateTicketComponent },
  { path: 'my-tickets', component: MyTicketsComponent},
  { path: 'ticket/:id', component: TicketDetailsComponent },
  { path: 'guest-ticket/:token', component: TicketDetailsComponent } ,
  {
    path: 'host',
    canActivate: [HostGuard],
    component: HostLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'listings', component: HostListingsComponent },
      { path: 'addapartment', component: AddApartmentComponent },
      { path: 'editlisting/:id', component: EditHostListingComponent },
      { path: 'listings/:listingId/rooms', component: HostRoomsComponent },
      { path: 'chat', component: ChatComponent },
      { path: 'booking', component: HostBookingComponent },
      { path: 'reviews', component: HostUserReviewsComponent },
      { path: 'myReviews', component: HostMyReviewsComponent },
      { path: 'requests', component: BookingRequestsComponent },
    ],
  },

  {
    path: 'admin',
    canActivate: [AdminGuard],
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'listings', component: AdminListingsComponent },
      { path: 'editlisting/:id', component: AdminEditlistingComponent },
      { path: 'approveHost', component: AdminHostsApproveComponent },
      { path: 'approvelistings', component: AdminApproveListingsComponent },
      { path: 'users', component: AdminUsersComponent },
    ],
  },

  { path: '**', component: NotfoundComponent },
  { path: 'signin-google', component: CallbackComponent },
];