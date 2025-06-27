import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogConfig,
} from '@angular/material/dialog';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { AuthService } from './core/services/auth.service';

// Add these imports for Google OAuth
import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
  GoogleInitOptions,
} from '@abacritt/angularx-social-login';
import { environment } from '../app/environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideAnimations(),

    // Material Default Configurations
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true,
        disableClose: true,
        minWidth: '400px',
        panelClass: 'custom-dialog-container',
      } as MatDialogConfig,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },

    // Google OAuth Configuration
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              environment.googleClientId, // From your environment.ts
              {
                oneTapEnabled: false,
                prompt: 'select_account', // Force account selection
                scopes: 'email profile', // Requested permissions
              } as GoogleInitOptions
            ),
          },
        ],
      } as SocialAuthServiceConfig,
    },

    AuthService,
  ],
};
