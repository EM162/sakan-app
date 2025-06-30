/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-center',
      toastClass: 'ngx-toastr custom-toastr',
      titleClass: 'custom-toastr-title',
      messageClass: 'custom-toastr-message',
      closeButton: true,
      progressBar: true,
      enableHtml: true,
      timeOut: 3000
    })
  ]
}).catch((err) => console.error(err));

