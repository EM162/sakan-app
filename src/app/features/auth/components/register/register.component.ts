import { Component } from '@angular/core';
import { Register } from '../../../../core/models/register';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  model: any = {};
  errors: string | null = null;
  constructor(private registerservice: AuthService, private router: Router) {
    // Initialize the model with default values if needed
    this.model = {
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      confirmpassword: '',
    };
  }

  onSubmit(form: any) {
    if (form.valid && this.model.password === this.model.confirmpassword) {
      this.registerservice.Register(this.model).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          // saving token on session
          // sessionStorage.setItem('token', response.token);
          this.registerservice.setLogin(response.token);
          console.log('Token saved to sessionStorage:', response.token);
          // Navigate to login or home page after successful registration
          this.router.navigateByUrl('home');
          localStorage.setItem('hostApprovedMessageShown', 'false');
        },
        error: (error) => {
          console.error('Registration failed', error);
          // Handle error, show message to user, etc.
          if (Array.isArray(error.error)) {
            this.errors = error.error.join(' | ');
          } else if (error.error?.message) {
            this.errors = error.error.message;
          } else {
            this.errors = 'Registration failed. Please try again.';
          }
        },
      });
    }
  }
}
