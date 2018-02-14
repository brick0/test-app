import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoDisplayComponent } from './go-display.component';

describe('GoDisplayComponent', () => {
  let component: GoDisplayComponent;
  let fixture: ComponentFixture<GoDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
