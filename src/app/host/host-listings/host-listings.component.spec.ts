import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostListingsComponent } from './host-listings.component';

describe('HostListingsComponent', () => {
  let component: HostListingsComponent;
  let fixture: ComponentFixture<HostListingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostListingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
