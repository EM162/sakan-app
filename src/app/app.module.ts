import { LOCALE_ID, NgModule } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ListingDetailsComponent } from './features/listings/pages/listing-details/listing-details.component';
import { FlatpickrModule } from 'angularx-flatpickr';
import { CommonModule } from '@angular/common';
import { RoomDetailsComponent } from './features/rooms/pages/room-details/room-details.component';

import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
registerLocaleData(localeAr);


@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    FlatpickrModule,
    HttpClientModule,
    CommonModule,
    AppComponent,
    ListingDetailsComponent,
    RoomDetailsComponent,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
     ToastrModule.forRoot({ // ✅ configure toastr here
      positionClass: 'toast-top-center',
      closeButton: true,
      progressBar: true,
      toastClass: 'ngx-toastr custom-toastr',
      titleClass: 'custom-toastr-title',
      messageClass: 'custom-toastr-message',
      enableHtml: true,
      timeOut: 3000
    }),
    AppRoutingModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'ar' }],
})
export class AppModule {}
