import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdfComponent } from './adf.component';

describe('AdfComponent', () => {
  let component: AdfComponent;
  let fixture: ComponentFixture<AdfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdfComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
