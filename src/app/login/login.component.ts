import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatDialogModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  model = { email: '', password: '' };
  apiError = '';
  isLoading = false;
  returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/hometest';

  onSubmit(form: any) {
    if (form.invalid) return;

    this.isLoading = true;
    this.apiError = '';

    this.authService.login(this.model).subscribe({
      next: (response) => {
        sessionStorage.setItem('token', response.token);
        // this.router.navigateByUrl(this.returnUrl);
        this.router.navigateByUrl('register'); 
      },
      error: (error) => {
        this.apiError =
          error.error?.message || 'Login failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false),
    });
  }

  externalLogin() {
    this.authService.initiateGoogleLogin();
  }

  clearError() {
    this.apiError = '';
  }
}
