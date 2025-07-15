import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { Subscription } from 'rxjs';
import { UserBookingRequestsComponent } from '../../features/bookings/components/user-booking-requests.component';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';
import { NotificationsComponent } from '../../notifications/notifications.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    UserBookingRequestsComponent,
    NotificationsComponent 
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('dropdownContainer') dropdownContainer?: ElementRef;

  isLoggedIn = false;
  private subscription!: Subscription;

  // isLoggedIn = true;
  isMobileMenuOpen = false;
  isDropdownOpen = false;
  showUserRequestsPopup = false;
  user = {
    name: '',
    profilePictureUrl: '',
  };

  hostStatus: string | null = null;
  isPopupVisible = false;
  userid!: string;
  statusPopupMessage = '';

  constructor(private authService: AuthService , private http:HttpClient, private router: Router) {}

      ngOnInit(): void {
        this.loadHostStatus();
        console.log('HOST STATUS:', this.hostStatus);
        this.subscription = this.authService.isLoggedIn$.subscribe(status => {
        this.isLoggedIn = status;

      if (status) {
        const userData = this.authService.getuserdata();
        this.userid = this.authService.getuserdata()?.id || '';
        this.user = {
          name: userData?.name || 'Guest',
          profilePictureUrl: 'https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png'
        };
      } else {
        this.user = {
          name: '',
          profilePictureUrl: '',
        };
      }
    });
  }

  //     ngOnInit(): void {
  //       this.loadHostStatus();
  //       console.log('HOST STATUS:', this.hostStatus);
  //       this.subscription = this.authService.isLoggedIn$.subscribe(status => {
  //       this.isLoggedIn = status;

  //     if (status) {
  //       const userData = this.authService.getuserdata();
  //       this.user = {
  //         name: userData?.name || 'Guest',
  //         profilePictureUrl: 'https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png'
  //       };
  //     } else {
  //       this.user = {
  //         name: '',
  //         profilePictureUrl: ''
  //       };
  //     }
  //   });
  // }

  //         profilePictureUrl: ''
  //       };
  //     }
  //   });
  // }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const decoded = jwtDecode(token) as { [key: string]: any };
    const userId =
      decoded[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ];

    return userId;
  }

  loadHostStatus() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    this.http
      .get<{ status: string }>(
        `https://localhost:7188/api/users/host-status/${userId}`
      )
      .subscribe({
        next: (res) => {
          this.hostStatus = res.status;
        },
        error: () => {
          this.hostStatus = null;
        },
      });
  }

onBecomeHostClick(): void {
    const role = this.authService.getRoleFromToken();
    console.log('User role:', role);

    if (role.includes('Admin')) {
      window.location.href = '/admin/dashboard';
      return;
    }

    if (role.includes('Host') || role.includes('Customer')) {
      const status = this.hostStatus?.toLowerCase();
      console.log('Host status:', status);

      if (!status || status === 'null' || status === 'undefined') {
        this.isPopupVisible = true;
      } else if (status === 'pending') {
        Swal.fire(
          'Pending',
          'Your request is pending. Please wait for admin approval.',
          'info'
        );
      } else if (status === 'accepted') {
        console.log('STATUS', status);
        const alreadyShown = localStorage.getItem('hostApprovedMessageShown');

        if (alreadyShown !== 'true') {
          // First time approved → show message + logout
          Swal.fire(
            'Approved',
            'You are now a host! Please log in again to continue.',
            'success'
          ).then(() => {
            localStorage.setItem('hostApprovedMessageShown', 'true');
            this.authService.logout();
            this.router.navigate(['/login']);
          });
        } else {
          // Already logged in again as host → go to dashboard
          window.location.href = '/host/dashboard';
        }
      } else if (status === 'rejected') {
        Swal.fire(
          'Rejected',
          'Sorry, your request to become a host was rejected.',
          'error'
        );
      } else {
        this.isPopupVisible = true;
      }
    }
  }



getHostButtonLabel(): string {
  const role = this.authService.getRoleFromToken();
  if (role.includes('Admin')) return 'Admin Dashboard';
  if (this.hostStatus === 'accepted') return 'Host Dashboard';
  return 'Become a Host';
}



  confirmBecomeHost() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      Swal.fire('Error', 'User not authenticated.', 'error');
      return;
    }

    this.http
      .post('https://localhost:7188/api/users/become-host', { userId })
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Request Submitted',
            text: 'Please wait for admin approval.',
            confirmButtonColor: '#3085d6',
          }).then(() => {
            this.isPopupVisible = false;
            this.loadHostStatus(); // reload status
          });
        },
        error: (err) => {
          console.error('Host request failed', err);
          Swal.fire('Error', 'Something went wrong.', 'error');
        },
      });
  }

  closePopup() {
    this.isPopupVisible = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  openUserRequestsPopup() {
    this.showUserRequestsPopup = true;
  }

  closeUserRequestsPopup() {
    this.showUserRequestsPopup = false;
  }

  // للاستماع لأي نقرة في الصفحة
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    // إذا كانت القائمة مفتوحة والنقرة حدثت خارج حاوية القائمة، قم بإغلاقها
    if (
      this.isDropdownOpen &&
      !this.dropdownContainer?.nativeElement.contains(event.target)
    ) {
      this.closeDropdown();
    }
  }
  // logout(): void {
  //   this.closeDropdown();
  // }

  closeAllMenus(): void {
    this.isMobileMenuOpen = false;
    // this.isDropdownOpen = false; // إذا كان لديك dropdown للديسكتوب
  }
}