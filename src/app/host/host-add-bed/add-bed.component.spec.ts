import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBedComponent } from './add-bed.component';

describe('AddBedComponent', () => {
  let component: AddBedComponent;
  let fixture: ComponentFixture<AddBedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddBedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
