import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { Register } from '../models/register';
import { Login } from '../models/Login';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';

interface JwtPayload {
  // Define your JWT claim types
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private socialAuthService = inject(SocialAuthService); // For Google OAuth

  // Token management
  private tokenKey = 'token';

  constructor() {
    this.setupGoogleAuthListener();
  }

  // ========================
  // GOOGLE OAUTH CONFIGURATION
  // ========================
  private setupGoogleAuthListener() {
    this.socialAuthService.authState.subscribe((user: SocialUser) => {
      if (user) {
        this.handleGoogleToken(user.idToken);
      }
    });
  }

  initiateGoogleLogin() {
    localStorage.setItem('preAuthRoute', window.location.pathname);
    window.location.href = `${environment.apiurlauth}/externallogin/google`;
  }

  private handleGoogleToken(idToken: string) {
    this.http
      .post(`${environment.apiurlauth}/sakanak`, { idToken })
      .pipe(
        tap((response: any) => {
          this.storeToken(response.token);
          this.router.navigateByUrl(this.handleGoogleCallback());
        }),
        catchError((error) => {
          console.error('Google login failed', error);
          return of(null);
        })
      )
      .subscribe();
  }

  handleGoogleCallback(): string {
    const returnUrl = localStorage.getItem('preAuthRoute') || '/';
    localStorage.removeItem('preAuthRoute');
    return returnUrl;
  }


  register(registerData: Register): Observable<any> {
    return this.http.post(`${environment.apiurlauth}/register`, registerData);
  }

  login(loginData: Login): Observable<any> {
    return this.http.post(`${environment.apiurlauth}/login`, loginData).pipe(
      tap((response: any) => {
        this.storeToken(response.token);
      })
    );
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
    this.socialAuthService.signOut();
    this.router.navigate(['/login']);
  }

  // ========================
  // TOKEN MANAGEMENT
  // ========================
  private storeToken(token: string) {
    sessionStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ========================
  // USER DATA DECODING
  // ========================
  getUserData(): {
    name: string;
    email: string;
    id: string;
    role: string;
  } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        name: decoded[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
        ],
        email:
          decoded[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
          ],
        id: decoded[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
        ],
        role: decoded[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ],
      };
    } catch (e) {
      console.error('Token decoding failed', e);
      return null;
    }
  }

  // ========================
  // EXTERNAL LOGIN (LEGACY)
  // ========================
  externalLogin() {
    window.location.href = `${environment.apiurlauth}/externallogin/google`;
  }
}
