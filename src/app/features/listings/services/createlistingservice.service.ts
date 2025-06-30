import { Injectable } from '@angular/core';
import { CreateListingDTO } from '../../../core/models/CreateListingDTO';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CreatelistingserviceService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  createListing(dto: CreateListingDTO): Observable<any> {
    const hostId = this.auth.getuserdata(); // Get hostId from token
    if (!hostId) {
      throw new Error('User not authenticated');
    }
    const formData = this.buildFormData(dto, hostId.id); // Use hostId.id
    return this.http.post<any>(environment.apiurllisting, formData);
  }

  private buildFormData(dto: CreateListingDTO, hostId: string): FormData {
    const formData = new FormData();
    formData.append('Title', dto.title);
    formData.append('Description', dto.description);
    formData.append('PricePerMonth', dto.pricePerMonth.toString());
    formData.append('MaxGuests', dto.maxGuests.toString());
    formData.append('Governorate', dto.governorate);
    formData.append('District', dto.district);
    formData.append('Latitude', dto.latitude.toString());
    formData.append('Longitude', dto.longitude.toString());
    formData.append('HostId', hostId);
    formData.append('IsBookableAsWhole', dto.isBookableAsWhole.toString());

    dto.listingPhotos.forEach((photo) => {
      formData.append('ListingPhotos', photo);
    });

    formData.append('Rooms', JSON.stringify(dto.rooms));

    return formData;
  }
}
