import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostLayoutComponent } from './host-layout.component';

describe('HostLayoutComponent', () => {
  let component: HostLayoutComponent;
  let fixture: ComponentFixture<HostLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
