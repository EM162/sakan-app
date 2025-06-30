import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditHostListingsComponent } from './edit-host-listings.component';

describe('EditHostListingsComponent', () => {
  let component: EditHostListingsComponent;
  let fixture: ComponentFixture<EditHostListingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditHostListingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditHostListingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
